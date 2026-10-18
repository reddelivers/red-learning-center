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
        // If storage bucket is missing or unconfigured, fallback to Base64 so it works instantly
        console.warn('Storage bucket upload failed, using local fallback:', uploadError.message);
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            handleFieldChange('imageUrl', result);
            void syncProfileToDatabase({ imageUrl: result });
          }
          setUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL from storage
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update state
      handleFieldChange('imageUrl', publicUrl);

      // Sync publicUrl directly to the profile's avatar_url in database
      await syncProfileToDatabase({ imageUrl: publicUrl });
    } catch (err) {
      console.error('Error handling image upload:', err);
    } finally {
      setUploading(false);
    }
  };

  const addNewBadge = () => {
    const tempId = `temp-${Date.now()}`;
    const newBadge: BadgeItem = {
      id: tempId,
      name: 'New Unlinked Agent',
      role: 'Delivery Agent',
      imageUrl: '',
      secureId: generateSecureIdFromName(tempId)
    };
    
    setBadges((prev) => {
      const updated = [...prev, newBadge];
      setActivePreviewIndex(updated.length - 1);
      return updated;
    });
  };

  const saveUnlinkedToDatabase = async () => {
    if (!activeBadge.id.startsWith('temp-')) return;

    setSavingStatus('Creating profile...');
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          full_name: activeBadge.name,
          job_title: activeBadge.role,
          avatar_url: activeBadge.imageUrl,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      setSavingStatus('Failed to create');
    } else if (data) {
      setDbUsers(prev => [...prev, data]);
      setBadges(prev => {
        const updated = [...prev];
        updated[activePreviewIndex] = {
          ...updated[activePreviewIndex],
          id: data.id,
          secureId: generateSecureIdFromName(data.id)
        };
        return updated;
      });
      setSavingStatus('Profile Created ✓');
      setTimeout(() => setSavingStatus(null), 2500);
    }
  };

  const removeBadge = (index: number) => {
    if (badges.length <= 1) return;
    setBadges((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setActivePreviewIndex((currIdx) => Math.max(0, currIdx > index ? currIdx - 1 : currIdx));
      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-ink-900 rounded-xl border border-white/10 text-white shadow-xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">RED ID Badge & Profile Manager</h2>
            <p className="text-xs text-ink-400">Updates here automatically sync with agent database profiles or stay as manual unlinked entries.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savingStatus && (
            <span className="text-xs font-semibold text-brand-400 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingStatus}
            </span>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Issue Date:</label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-28 px-3 py-1.5 bg-ink-950 border border-white/10 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Live UI Preview Box */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Live
