import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BadgeDocument } from './BadgeDocument';
import { Award, Plus, Trash2, Download, User, Upload, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BadgeItem {
  id: string; // Real Supabase UUID or temp ID
  name: string;
  role: string;
  imageUrl: string;
  verificationUrl?: string;
  secureId?: string; // Display ID (RED-XXX)
}

const generateSecureIdFromName = (name: string): string => {
  if (!name) return 'RED-000000';
  let hash = 0;
  const cleanName = name.trim().toLowerCase();
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36).toUpperCase();
  const randomSuffix = Math.abs(hash * 31).toString(36).toUpperCase();
  return `RED-${positiveHash}${randomSuffix}`.slice(0, 11);
};

export const BadgeGenerator: React.FC = () => {
  const [issueDate, setIssueDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  });
  
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Fetch real users from the Supabase profiles table on load
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (!error && data) {
        setDbUsers(data);
        if (data.length > 0 && badges.length === 0) {
          setBadges([{
            id: data[0].id,
            name: data[0].full_name || 'Agent',
            role: data[0].job_title || data[0].role || 'Delivery Agent',
            imageUrl: data[0].avatar_url || '',
            secureId: generateSecureIdFromName(data[0].id)
          }]);
        }
      }
    }
    fetchUsers();
  }, []);

  const activeBadge = badges[activePreviewIndex] || { id: 'temp', name: 'Select User', role: 'Delivery Agent', imageUrl: '' };
  const activeSecureId = activeBadge.secureId || generateSecureIdFromName(activeBadge.id || activeBadge.name);
  const activeVerifyData = activeBadge.verificationUrl || `https://training.reddelivers.com/verify?id=${activeBadge.id}`;
  const activeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeVerifyData)}`;

  // Function to sync current active badge edits/uploads back to the Supabase database profile
  const syncProfileToDatabase = async (updatedFields: Partial<BadgeItem>) => {
    // Skip if it's a temporary unlinked ID
    if (!activeBadge.id || activeBadge.id.startsWith('temp-') || activeBadge.id.length < 10) {
      setSavingStatus('Local only (Unlinked)');
      setTimeout(() => setSavingStatus(null), 2000);
      return;
    }

    setSavingStatus('Syncing to profile...');
    const payload: any = {};
    if (updatedFields.name !== undefined) payload.full_name = updatedFields.name;
    if (updatedFields.role !== undefined) payload.job_title = updatedFields.role;
    if (updatedFields.imageUrl !== undefined) payload.avatar_url = updatedFields.imageUrl;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', activeBadge.id);

    if (error) {
      console.error('Failed to sync profile changes to Supabase:', error);
      setSavingStatus('Error saving');
    } else {
      setSavingStatus('Saved to Profile ✓');
      setTimeout(() => setSavingStatus(null), 2500);
    }
  };

  const handleFieldChange = (field: keyof BadgeItem, value: string) => {
    setBadges((prevBadges) => {
      const updated = [...prevBadges];
      updated[activePreviewIndex] = {
        ...updated[activePreviewIndex],
        [field]: value,
      };
      return updated;
    });

    // Auto-sync text changes to database if linked
    if (field === 'name' || field === 'role') {
      void syncProfileToDatabase({ [field]: value });
    }
  };

  const handleDbUserSelect = (userId: string) => {
    const user = dbUsers.find(u => u.id === userId);
    if (!user) return;

    setBadges((prevBadges) => {
      const updated = [...prevBadges];
      updated[activePreviewIndex] = {
        id: user.id,
        name: user.full_name || 'Agent',
        role: user.job_title || user.role || 'Delivery Agent',
        imageUrl: user.avatar_url || '',
        secureId: generateSecureIdFromName(user.id)
      };
      return updated;
    });
  };

  // Handle Image File Upload -> Supabase Storage Bucket -> Save to Profile avatar_url
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBadge.id) return;

    setUploading(true);
    setSavingStatus('Uploading image...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeBadge.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If storage bucket is missing or unconfigured, fallback
