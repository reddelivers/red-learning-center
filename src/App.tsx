import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, Bell, LayoutDashboard, Loader2, LogOut, Menu, RefreshCw, Search, User, X } from 'lucide-react';
import { supabase, type ModuleWithProgress, type ProgressStatus } from '@/lib/supabase';
import { Auth } from '@/components/Auth';
import { Dashboard } from '@/components/Dashboard';
import { ModuleViewer } from '@/components/ModuleViewer';
import { Sidebar } from '@/components/Sidebar';
import { Certificate } from '@/components/Certificate';
import { ProfileSettings } from '@/components/ProfileSettings';
import { AdminContentManager } from '@/components/AdminContentManager';
import { AdminLearnerProgress } from '@/components/AdminLearnerProgress';
import { AdminAddLearner } from '@/components/AdminAddLearner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'module' | 'certificate' | 'profile' | 'admin_content' | 'admin_learners' | 'admin_add_learner'>('dashboard');
  const [activeSectionName, setActiveSectionName] = useState<string>('');
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Trainee';

  // 1. Manage Supabase Session Authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadTraining = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    const [{ data: moduleRows, error: moduleError }, { data: progressRows, error: progressError }] = await Promise.all([
      supabase.from('modules').select('*').order('section').order('order_index'),
      supabase.from('progress').select('*').eq('user_id', session.user.id),
    ]);

    if (moduleError || progressError) {
      setError('We could not load your training content. Please try again.');
      setLoading(false);
      return;
    }

    const progressByModule = new Map((progressRows ?? []).map((row) => [row.module_id, row]));
    setModules((moduleRows ?? []).map((module) => ({ ...module, progress: progressByModule.get(module.id) ?? null })));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      void loadTraining();
    }
  }, [session, loadTraining]);

  const activeModule = useMemo(
    () => modules.find((module) => module.id === activeModuleId) ?? null,
    [modules, activeModuleId]
  );
  const activeSection = activeModule?.section ?? null;
  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((module) =>
      `${module.title} ${module.description} ${module.section}`.toLowerCase().includes(query)
    );
  }, [modules, search]);

  async function openModule(moduleId: string) {
    if (!session) return;
    setActiveModuleId(moduleId);
    setView('module');
    setMobileOpen(false);
    const current = modules.find((module) => module.id === moduleId);
    if (!current || current.progress?.status === 'completed') return;

    const nextStatus: ProgressStatus = 'in_progress';
    const now = new Date().toISOString();
    const { data, error: progressError } = await supabase
      .from('progress')
      .upsert(
        { user_id: session.user.id, module_id: moduleId, status: nextStatus, last_viewed_at: now, updated_at: now },
        { onConflict: 'user_id,module_id' }
      )
      .select()
      .maybeSingle();

    if (progressError) return;
    if (data) {
      setModules((items) => items.map((module) => module.id === moduleId ? { ...module, progress: data } : module));
    }
  }

  async function markComplete(moduleId: string) {
    if (!session) return;
    const current = modules.find((module) => module.id === moduleId);
    const isCompleted = current?.progress?.status === 'completed';
    setSaving(true);
    const now = new Date().toISOString();
    const { data, error: progressError } = await supabase
      .from('progress')
      .upsert(
        {
          user_id: session.user.id,
          module_id: moduleId,
          status: isCompleted ? 'in_progress' : 'completed',
          completed_at: isCompleted ? null : now,
          last_viewed_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,module_id' }
      )
      .select()
      .maybeSingle();
    setSaving(false);
    if (progressError) {
      setError('Your progress could not be saved. Please try again.');
      return;
    }
    if (data) {
      setModules((items) => items.map((module) => module.id === moduleId ? { ...module, progress: data } : module));
    }
  }

  function goToDashboard() {
    setView('dashboard');
    setActiveModuleId(null);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col lg:flex-row">
      <div className="lg:hidden h-16 bg-ink-950 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center p-0 m-0">
            <span className="text-sm font-bold text-center leading-none text-white">RLC</span>
          </div>
          <span className="font-bold">RED Learning Center</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => void supabase.auth.signOut()} className="p-2 text-ink-300 hover:text-white" title="Sign Out">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setMobileOpen((open) => !open)} className="p-2 text-ink-300 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block absolute lg:relative z-20 w-full lg:w-auto`}>
        <Sidebar
          modules={visibleModules}
          activeSection={activeSection}
          activeModuleId={activeModuleId}
          onSelectModule={openModule}
          onSelectSection={() => undefined}
          userRole={profile?.role}
          currentView={view}
          onSelectView={(selectedView) => {
            setView(selectedView as any);
            setMobileOpen(false);
            setActiveModuleId(null);
          }}
        />
      </div>

      <main className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-ink-200/70 flex items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <button onClick={goToDashboard} className="hover:text-brand-600 transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            {view === 'module' && activeModule && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium truncate max-w-[180px]">{activeModule.title}</span>
              </>
            )}
            {view === 'certificate' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Certificate</span>
              </>
            )}
            {view === 'profile' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Profile Settings</span>
              </>
            )}
            {view === 'admin_content' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Manage Content</span>
              </>
            )}
            {view === 'admin_learners' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Learner Progress & Certs</span>
              </>
            )}
            {view === 'admin_add_learner' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Add New Learner</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-ink-50 border border-ink-200 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
              <Search className="w-4 h-4 text-ink-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search training..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
            </div>
            <button 
              onClick={() => setView('profile')} 
              className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
              title="Profile Settings"
            >
              <User className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 transition-colors relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => void supabase.auth.signOut()} 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 rounded-lg transition-colors border border-ink-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-5 lg:p-8">
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span>
              <button onClick={() => void loadTraining()} className="font-semibold hover:underline">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-ink-500">
                <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
                <p className="text-sm">Loading your training...</p>
              </div>
            </div>
          ) : view === 'admin_content' ? (
            <AdminContentManager />
          ) : view === 'admin_learners' ? (
            <AdminLearnerProgress />
          ) : view === 'admin_add_learner' ? (
            <AdminAddLearner />
          ) : modules.length === 0 ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                <h2 className="font-bold text-ink-900">No training modules yet</h2>
                <p className="mt-1 text-sm text-ink-500">Your training library will appear here when it is ready.</p>
              </div>
            </div>
          ) : view === 'module' && activeModule ? (
            <ModuleViewer module={activeModule} onBack={goToDashboard} onMarkComplete={markComplete} isSaving={saving} />
          ) : view === 'certificate' ? (
            <Certificate sectionName={activeSectionName} modules={modules} userName={userName} onBack={goToDashboard} />
          ) : view === 'profile' ? (
            <ProfileSettings currentName={userName} onBack={goToDashboard} />
          ) : (
            <Dashboard 
              modules={visibleModules} 
              onOpenModule={openModule} 
              onContinue={openModule} 
              onViewCertificate={(sectionName) => {
                setActiveSectionName(sectionName);
                setView('certificate');
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;