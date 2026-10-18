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
              Live Card Preview ({badges.length > 0 ? activePreviewIndex + 1 : 0} of {badges.length})
            </span>
            <div className="flex gap-1.5 flex-wrap max-w-[220px] justify-end">
              {badges.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePreviewIndex(idx)}
                  className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                    activePreviewIndex === idx ? 'bg-brand-600 text-white' : 'bg-ink-950 text-ink-400 hover:bg-white/5'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={addNewBadge}
                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-brand-400 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* PDF Mockup Card */}
          <div className="w-full aspect-[1.58/1] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col text-black border border-stone-300 relative select-none">
            <div className="bg-[#1a1a1a] h-[33.33%] flex items-center">
              <div className="w-[34%]" />
              <div className="flex-1 flex items-center justify-center pr-3">
                <img 
                  src="https://static.wixstatic.com/media/34d825_e580ba21bc68413e9510a48b2143ac23~mv2.png/v1/fill/w_398,h_230,al_c,lg_1,q_85,enc_avif,quality_auto/RELIABLE%20EXPEDITED%20DELIVERY%20BLACK_edited.png" 
                  alt="RED Logo" 
                  className="max-w-[68%] max-h-[68%] object-contain"
                />
              </div>
            </div>

            <div className="flex-1 bg-white relative flex">
              <div className="w-[35%]" />
              <div className="flex-1 flex flex-col justify-center items-center">
                <span className="font-black text-base text-stone-900 tracking-tight truncate leading-tight mb-2 text-center px-4 w-full">
                  {activeBadge.name ? activeBadge.name.toUpperCase() : 'AGENT NAME'}
                </span>
                
                <div className="bg-red-600 text-white font-black text-[11px] py-1.5 tracking-wider text-center shadow-sm w-full truncate px-2">
                  {activeBadge.role ? activeBadge.role.toUpperCase() : 'DELIVERY AGENT'}
                </div>
              </div>
            </div>

            <div className="absolute right-2 bottom-[26px] w-[32px] h-[32px] bg-white p-0.5 rounded shadow-sm z-30 flex items-center justify-center">
              <img src={activeQrCodeUrl} alt="Verify QR Code" className="w-full h-full object-contain" />
            </div>

            <div className="bg-[#1a1a1a] h-[22px] flex items-center justify-between px-3.5 z-10">
              <span className="text-[7.5px] text-white font-extrabold tracking-wider">
                ID: {activeSecureId}
              </span>
              <span className="text-[7.5px] text-white font-extrabold tracking-wider">
                ISSUED: {issueDate.toUpperCase()}
              </span>
            </div>

            <div className="absolute left-3 bottom-[26px] w-[34.1%] top-3.5 bg-stone-100 border-2 border-stone-400 overflow-hidden shadow-md flex items-center justify-center z-20">
              {activeBadge.imageUrl ? (
                <img src={activeBadge.imageUrl} alt="Agent" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-stone-400" />
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Form & Database Selection */}
        <div className="space-y-5 bg-ink-950 p-5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Connected Profile Data
            </span>
            {badges.length > 1 && (
              <button
                onClick={() => removeBadge(activePreviewIndex)}
                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Card
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400">
                  Link to Database Profile
                </label>
                {activeBadge.id?.startsWith('temp-') && (
                  <button
                    onClick={saveUnlinkedToDatabase}
                    className="text-[10px] text-brand-400 hover:text-brand-300 underline font-medium"
                  >
                    + Save to Database Now
                  </button>
                )}
              </div>
              <select
                value={activeBadge.id}
                onChange={(e) => handleDbUserSelect(e.target.value)}
                className="w-full px-3 py-2 bg-ink-900 border border-brand-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="" disabled>Select user from database...</option>
                {activeBadge.id?.startsWith('temp-') && (
                  <option value={activeBadge.id}>✨ Unlinked Manual Entry (Temporary)</option>
                )}
                {dbUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || 'Unknown'} — {user.job_title || user.role || 'Agent'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-ink-500 mt-1">
                {activeBadge.id?.startsWith('temp-') 
                  ? 'Currently unlinked. You can export it or click "Save to Database Now" to register it.' 
                  : 'Links QR verification directly to this user\'s live profile record.'}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={activeBadge.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-ink-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-1">
                Job Title / Role Banner (SQL: job_title)
              </label>
              <input
                type="text"
                value={activeBadge.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                placeholder="e.g. Senior Fleet Captain"
                className="w-full px-3 py-2 bg-ink-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-1">
                Upload Profile Image
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-ink-900 border border-brand-500/40 rounded-lg text-xs font-semibold text-brand-300 hover:bg-white/5 cursor-pointer transition">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? 'Uploading to Storage...' : 'Upload Image File...'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                {activeBadge.imageUrl && <span className="text-xs text-emerald-400 font-medium">✓ Ready</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-ink-400 font-medium">
          {badges.length} total badge{badges.length === 1 ? '' : 's'} ready for compilation.
        </span>
        
        {badges.length > 0 && (
          <PDFDownloadLink
            document={<BadgeDocument badges={badges} issueDate={issueDate} />}
            fileName="RED_Badges_Batch.pdf"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-brand-600/30"
          >
            {({ loading }) => (
              <>
                <Download className="w-4 h-4" />
                <span>{loading ? 'Compiling PDF...' : 'Download Badge PDF Batch'}</span>
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};
