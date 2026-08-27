import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BadgeDocument } from './BadgeDocument';
import { Award, Plus, Trash2, Download, User, Upload } from 'lucide-react';

interface BadgeItem {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  verificationUrl?: string;
}

export const BadgeGenerator: React.FC = () => {
  const [issueDate, setIssueDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  });
  
  const [badges, setBadges] = useState<BadgeItem[]>([
    { 
      id: '1', 
      name: 'Jane Doe', 
      role: 'Delivery Agent', 
      imageUrl: 'https://scontent-atl3-1.xx.fbcdn.net/v/t39.30808-6/566244133_795341243476824_149405202054137702_n.jpg?stp=dst-jpg_tt6&cstp=mx796x1024&ctp=s796x1024&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=i6VDDxkrKpMQ7kNvwE1_90b&_nc_oc=Adr73fXo9V1f9rUrPJaanRx3xQVyGqmKQ-H2uHLpBdOxzFWM_zW3-6g__UZM9HbEcByi4fKfO3li-js2d2qPIBdm&_nc_zt=23&_nc_ht=scontent-atl3-1.xx&_nc_gid=CeyTjAllisAtv_EhgGW4Fw&_nc_ss=7b289&oh=00_AQE0PbyVYnsP2a3dugFuTL6zMn46XigAJ_GznQTj_8zIug&oe=6A966AE7' 
    },
  ]);

  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  const activeBadge = badges[activePreviewIndex] || badges[0] || { id: '1', name: '', role: 'Delivery Agent', imageUrl: '' };

  // Compute live QR code URL for the active preview card
  const activeVerifyData = activeBadge.verificationUrl || `https://yourdomain.com/verify?id=${activeBadge.id}`;
  const activeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeVerifyData)}`;

  const handleFieldChange = (field: keyof BadgeItem, value: string) => {
    setBadges((prevBadges) => {
      const updated = [...prevBadges];
      updated[activePreviewIndex] = {
        ...updated[activePreviewIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleFieldChange('imageUrl', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const addNewBadge = () => {
    const newBadge: BadgeItem = {
      id: Date.now().toString(),
      name: 'New Agent',
      role: 'Delivery Agent',
      imageUrl: '',
    };
    setBadges((prev) => {
      const updated = [...prev, newBadge];
      setActivePreviewIndex(updated.length - 1);
      return updated;
    });
  };

  const removeBadge = (index: number) => {
    if (badges.length <= 1) return;
    setBadges((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setActivePreviewIndex((currIdx) => Math.max(0, currIdx > index ? currIdx - 1 : currIdx));
      return updated;
    });
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0) {
          setBadges(json);
          setActivePreviewIndex(0);
        }
      } catch (err) {
        console.error('Invalid JSON file format', err);
      }
    };
    reader.readAsText(file);
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
            <h2 className="text-lg font-bold text-white">RED ID Badge Generator</h2>
            <p className="text-xs text-ink-400">Configure batch records, upload photos, and preview live credentials.</p>
          </div>
        </div>

        {/* Global Issue Date Input */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Live UI Preview Box */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Live Card Preview ({activePreviewIndex + 1} of {badges.length})
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
                title="Add Badge"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Exact Visual ID Card Mockup with Edge-to-Edge Banner & QR Code */}
          <div className="w-full aspect-[1.58/1] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col text-black border border-stone-300 relative select-none">
            {/* Top Third Black Header */}
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

            {/* Middle Content Area with Edge-to-Edge Red Role Banner */}
            <div className="flex-1 bg-white relative flex">
              <div className="w-[35%]" />
              <div className="flex-1 flex flex-col justify-center items-center">
                <span className="font-black text-base text-stone-900 tracking-tight truncate leading-tight mb-2 text-center px-4 w-full">
                  {activeBadge.name ? activeBadge.name.toUpperCase() : 'AGENT NAME'}
                </span>
                
                <div className="bg-red-600 text-white font-black text-[11px] py-1.5 tracking-wider text-center shadow-sm w-full">
                  {activeBadge.role ? activeBadge.role.toUpperCase() : 'DELIVERY AGENT'}
                </div>
              </div>
            </div>

            {/* Live Scannable QR Code Box */}
            <div className="absolute right-2 bottom-[26px] w-[32px] h-[32px] bg-white p-0.5 rounded shadow-sm z-30 flex items-center justify-center">
              <img src={activeQrCodeUrl} alt="Verify QR Code" className="w-full h-full object-contain" />
            </div>

            {/* Bottom Black Footer with ID & Issued Date */}
            <div className="bg-[#1a1a1a] h-[22px] flex items-center justify-between px-3.5 z-10">
              <span className="text-[7.5px] text-white font-extrabold tracking-wider">
                ID: {activeBadge.id}
              </span>
              <span className="text-[7.5px] text-white font-extrabold tracking-wider">
                ISSUED: {issueDate.toUpperCase()}
              </span>
            </div>

            {/* Absolute Positioned Wider Photo Frame */}
            <div className="absolute left-3 bottom-[26px] w-[34.1%] top-3.5 bg-stone-100 border-2 border-stone-400 overflow-hidden shadow-md flex items-center justify-center z-20">
              {activeBadge.imageUrl ? (
                <img src={activeBadge.imageUrl} alt="Agent" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-stone-400" />
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Form Inputs & Image Upload */}
        <div className="space-y-5 bg-ink-950 p-5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Edit Selected Badge
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
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-1">
                Agent Full Name
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
                Role / Title Banner
              </label>
              <input
                type="text"
                value={activeBadge.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="w-full px-3 py-2 bg-ink-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400 mb-1">
                Agent Photo Upload
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-ink-900 border border-white/10 rounded-lg text-xs font-medium text-brand-300 hover:bg-white/5 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Choose Image File...</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </label>
                {activeBadge.imageUrl && (
                  <span className="text-xs text-emerald-400 font-medium">✓ Loaded</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-ink-400">
              Import Batch Data (JSON)
            </label>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleJsonFileUpload}
              className="block w-full text-xs text-ink-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600/20 file:text-brand-300 hover:file:bg-brand-600/30 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Footer Action Row */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-ink-400 font-medium">
          {badges.length} total badge{badges.length === 1 ? '' : 's'} ready for compilation.
        </span>
        
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
      </div>
    </div>
  );
};