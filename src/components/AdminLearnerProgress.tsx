import { useEffect, useState } from 'react';
import { Users, Loader2, CheckCircle2, Clock, AlertCircle, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminLearnerProgressProps {
  onViewCertificate?: (sectionName: string, userName: string, modules: any[]) => void;
}

export function AdminLearnerProgress({ onViewCertificate }: AdminLearnerProgressProps) {
  const [learners, setLearners] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true);
      setError(null);

      const [
        { data: profiles, error: profilesError }, 
        { data: progressRows, error: progressError },
        { data: moduleRows, error: moduleError }
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('progress').select('*'),
        supabase.from('modules').select('*')
      ]);

      if (profilesError) {
        setError(`Profiles error: ${profilesError.message}`);
        setLoading(false);
        return;
      }

      if (progressError) {
        setError(`Progress error: ${progressError.message}`);
        setLoading(false);
        return;
      }

      if (moduleError) {
        setError(`Modules error: ${moduleError.message}`);
        setLoading(false);
        return;
      }

      const allModules = moduleRows ?? [];
      setModules(allModules);

      const moduleMap = new Map(allModules.map((m) => [m.id, m]));

      const combined = (profiles ?? []).map((profile) => {
        const userProgress = (progressRows ?? []).filter((p) => p.user_id === profile.id);
        
        const completedModules = userProgress
          .filter((p) => p.status === 'completed')
          .map((p) => ({
            ...p,
            module: moduleMap.get(p.module_id)
          }))
          .filter((p) => p.module != null);

        const inProgressModules = userProgress
          .filter((p) => p.status === 'in_progress')
          .map((p) => ({
            ...p,
            module: moduleMap.get(p.module_id)
          }))
          .filter((p) => p.module != null);

        return {
          ...profile,
          completedModules,
          inProgressModules,
          completedCount: completedModules.length,
          inProgressCount: inProgressModules.length,
        };
      });

      setLearners(combined);
      setLoading(false);
    }

    void fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-ink-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Learner Progress & Roster</h2>
          <p className="text-sm text-ink-500">Track student engagement, completed module titles, and certificates.</p>
        </div>
        <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {learners.length} Total Users
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink-50 border-b border-ink-100 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <th className="py-3 px-6">Learner Name / Email</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6">Completed Modules</th>
              <th className="py-3 px-6">In Progress</th>
              <th className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 text-sm">
            {learners.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-400">
                  No learners found in the database.
                </td>
              </tr>
            ) : (
              learners.map((learner) => (
                <tr key={learner.id} className="hover:bg-ink-50/50 transition-colors align-top">
                  <td className="py-4 px-6 font-medium text-ink-900">
                    {learner.full_name || 'Unnamed Trainee'}
                    <span className="block text-xs font-normal text-ink-400">{learner.email}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      learner.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-ink-100 text-ink-700'
                    }`}>
                      {learner.role || 'learner'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold mb-1">
                        <CheckCircle2 className="w-4 h-4" /> {learner.completedCount} Completed
                      </span>
                      {learner.completedModules.length > 0 ? (
                        <ul className="text-xs text-ink-600 space-y-0.5 pl-5 list-disc">
                          {learner.completedModules.map((item: any) => (
                            <li key={item.id}>
                              <span className="font-medium text-ink-800">{item.module.title}</span>
                              <span className="text-ink-400 ml-1">({item.module.section})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-ink-400 italic">None completed yet</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-brand-600 font-semibold mb-1">
                        <Clock className="w-4 h-4" /> {learner.inProgressCount} In Progress
                      </span>
                      {learner.inProgressModules.length > 0 ? (
                        <ul className="text-xs text-ink-600 space-y-0.5 pl-5 list-disc">
                          {learner.inProgressModules.map((item: any) => (
                            <li key={item.id}>
                              <span className="font-medium text-ink-800">{item.module.title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {onViewCertificate && learner.completedModules.length > 0 && (
                      <button
                        onClick={() => {
                          // Pick the first completed module's section or default to the first available section
                          const sectionName = learner.completedModules[0]?.module?.section || modules[0]?.section || 'Training';
                          const modulesWithProgress = modules.map((m) => ({
                            ...m,
                            progress: learner.completedModules.find((cm: any) => cm.module_id === m.id) || null
                          }));
                          onViewCertificate(sectionName, learner.full_name || learner.email, modulesWithProgress);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" /> View Certificate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}