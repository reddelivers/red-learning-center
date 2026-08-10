import { Award, CheckCircle2, Download } from 'lucide-react';
import type { ModuleWithProgress } from '@/lib/supabase';

interface CertificateProps {
  sectionName: string;
  modules: ModuleWithProgress[];
  userName?: string;
  onBack: () => void;
}

export function Certificate({ sectionName, modules, userName, onBack }: CertificateProps) {
  const sectionModules = modules.filter((m) => m.section === sectionName);
  const completedCount = sectionModules.filter((m) => m.progress?.status === 'completed').length;
  const isComplete = sectionModules.length > 0 && completedCount === sectionModules.length;

  const displayName = userName || 'Trainee';

  if (!isComplete) {
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-8 text-center max-w-xl mx-auto shadow-sm">
        <Award className="w-12 h-12 text-ink-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-ink-900">Certificate Locked</h3>
        <p className="text-sm text-ink-500 mt-1">
          Complete all {sectionModules.length} modules in the "{sectionName}" section to unlock your certificate.
        </p>
        <button onClick={onBack} className="mt-6 btn-primary">Back to Training</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <button onClick={onBack} className="btn-ghost">← Back to Overview</button>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" /> Save as PDF
        </button>
      </div>

      <div id="certificate-card" className="bg-white rounded-2xl border-4 border-brand-600/20 p-10 sm:p-14 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-brand-600" />
        
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Certificate of Completion</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-950 mt-2 mb-2">RED Learning Center</h1>
        
        <p className="text-sm text-ink-500 mb-4">This certifies that</p>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-700 tracking-wide mb-3">
          {displayName}
        </h2>

        <p className="text-sm text-ink-500 mb-4">has successfully completed all training requirements for</p>
        
        <h3 className="text-xl font-bold text-ink-900 border-y border-ink-100 py-3 my-2 bg-ink-50/50">
          {sectionName}
        </h3>

        <div className="mt-8 flex justify-between items-end text-xs text-ink-400 border-t border-ink-100 pt-4">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Verified Section Completion
          </div>
          <div>Date Issued: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            background-color: white !important;
          }
          /* Hide non-certificate elements */
          header, 
          aside, 
          button, 
          .print\\:hidden {
            display: none !important;
          }
          #certificate-card {
            display: block !important;
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 100% !important;
            max-width: 950px !important;
            border: 4px solid rgba(14, 116, 144, 0.2) !important;
            box-shadow: none !important;
            padding: 3rem !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}