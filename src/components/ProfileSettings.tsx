import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

interface ProfileSettingsProps {
  currentName: string;
  onBack: () => void;
}

export function ProfileSettings({ currentName, onBack }: ProfileSettingsProps) {
  const [newName, setNewName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName }
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button onClick={onBack} className="btn-ghost -ml-3">
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </button>

      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">Trainee Profile</h2>
            <p className="text-sm text-ink-500">Update how your name appears on your certificates.</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile name updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary py-2.5 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}