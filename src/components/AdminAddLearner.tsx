import { useState } from 'react';
import { UserPlus, Loader2, CheckCircle, AlertCircle, Mail, User, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AdminAddLearner() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('learner');
  const [tempPassword, setTempPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Note: To create users directly without email confirmation flows, 
    // admins typically use Supabase Auth signUp or an invited signup.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: { full_name: fullName }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If a user was successfully created, optionally update their role in profiles table if needed
    if (data.user && role === 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id);
    }

    setLoading(false);
    setSuccess(true);
    setEmail('');
    setFullName('');
    setTempPassword('');
    setRole('learner');
  }

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl border border-ink-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink-900">Add New Learner</h2>
          <p className="text-sm text-ink-500">Provision a new account for a student or team member.</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 shrink-0" /> Learner account successfully created! They can now sign in with their temporary password.
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Full Name *</label>
          <div className="relative">
            <User className="w-5 h-5 text-ink-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Email Address *</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-ink-400 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Temporary Password *</label>
            <input
              type="text"
              required
              minLength={6}
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-ink-200 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">System Role</label>
            <div className="relative">
              <Shield className="w-5 h-5 text-ink-400 absolute left-3 top-2.5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 text-sm bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option value="learner">Learner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Learner Account
        </button>
      </form>
    </div>
  );
}