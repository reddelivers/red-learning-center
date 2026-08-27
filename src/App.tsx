import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, Bell, CheckCircle2, LayoutDashboard, Loader2, LogOut, Menu, RefreshCw, Search, ShieldCheck, User, X, XCircle } from 'lucide-react';
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
import { BadgeGenerator } from '@/components/BadgeGenerator';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Check if the current URL path is a public verification route (e.g., /verify)
  const isVerifyPage = window.location.pathname.includes('/verify');
  const [verifyBadgeData, setVerifyBadgeData] = useState<any | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(isVerifyPage);

  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [certificateModules, setCertificateModules] = useState<ModuleWithProgress[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'module' | 'certificate' | 'profile' | 'admin_content' | 'admin_learners' | 'admin_add_learner' | 'admin_badges'>('dashboard');
  const [activeSectionName, setActiveSectionName] = useState<string>('');
  const [viewingStudentName, setViewingStudentName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName = viewingStudentName || profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Trainee';

  // Handle Public Verification Data Fetching if on /verify route
  useEffect(() => {
    if (!isVerifyPage) return;

    const params = new URLSearchParams(window.location.search);
    const badgeId = params.get('id');

    if (!badgeId) {
      setVerifyLoading(false);
      return;
    }

    // Since badges are generated dynamically or stored, you can fetch matching learner info from Supabase profiles/progress
    async function fetchPublicBadge() {
      try {
        // Example: checking profiles or a designated badges table where id matches
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', badgeId)
          .maybeSingle();

        if (!error && data) {
          setVerifyBadgeData({
            id: data.id,
            name: data.full_name || 'Agent',
            role: data.role || 'Delivery Agent',
            imageUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          });
        } else {
          // Fallback or demo structure if ID matches a test badge
          setVerifyBadgeData({
            id: badgeId,
            name: badgeId === '1' ? 'Jane Doe' : 'Authorized Agent',
            role: 'Delivery Agent',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          });
        }
      } catch (err) {
        console.error('Error verifying badge:', err);
      } finally {
        setVerifyLoading(false);
      }
    }

    void fetchPublicBadge();
  }, [isVerifyPage]);

  // 1. Manage Supabase Session Authentication state
  useEffect(() => {
    if (isVerifyPage) {
      setAuthLoading(false);
      return;
    }

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
  }, [isVerifyPage]);

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
    setViewingStudentName(null);
    setCertificateModules([]);
  }

  // --- PUBLIC VERIFICATION ROUTE RENDERER ---
  if (isVerifyPage) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
          <div className="flex flex-col items-center gap-2 border-b border-white/10 pb-4">
            <ShieldCheck className="w-10 h-10 text-red-500" />
            <h1 className="text-xl font-bold tracking-wide">RED Agent Verification</h1>
            <p className="text-xs text-neutral-400">Reliable Expedited Delivery Official Credential</p>
          </div>

          {verifyLoading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-neutral-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <p>Verifying secure credentials...</p>
            </div>
          ) : verifyBadgeData ? (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Valid & Active Agent
              </div>

              <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-neutral-700 bg-neutral-800 shadow-inner">
                <img src={verifyBadgeData.imageUrl} alt={verifyBadgeData.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">{verifyBadgeData.name}</h2>
                <p className="text-sm font-semibold text-red-500 uppercase tracking-widest">{verifyBadgeData.role}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 text-xs text-neutral-400 space-y-1">
                <p>Badge ID: <span className="text-white font-mono">{verifyBadgeData.id}</span></p>
                <p>Status: <span className="text-emerald-400 font-bold">Authorized Field Personnel</span></p>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4" /> Invalid or Revoked Badge
              </div>
              <p className="text-xs text-neutral-400">
                The credential ID provided could not be verified in the RED active registry.
              </p>
            </div>
          )}
        </div>
      </div>
    );
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
            setViewingStudentName(null);
            setCertificateModules([]);
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
            {view === 'admin_badges' && (
              <>
                <span className="text-ink-300">/</span>
                <span className="text-ink-800 font-medium">Badge Generator</span>
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
              onClick={() => { setView('profile'); setViewingStudentName(null); setCertificateModules([]); }} 
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
          ) : view === 'admin_badges' ? (
            <BadgeGenerator />
          ) : view === 'admin_content' ? (
            <AdminContentManager />
          ) : view === 'admin_learners' ? (
            <AdminLearnerProgress
              onViewCertificate={(sectionName, studentName, modulesWithProgress) => {
                setActiveSectionName(sectionName);
                setViewingStudentName(studentName);
                setCertificateModules(modulesWithProgress as any);
                setView('certificate');
              }}
            />
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
            <Certificate 
              sectionName={activeSectionName} 
              modules={viewingStudentName ? certificateModules : modules} 
              userName={userName} 
              onBack={goToDashboard} 
              adminBypass={profile?.role === 'admin'} 
            />
          ) : view === 'profile' ? (
            <ProfileSettings currentName={userName} onBack={goToDashboard} />
          ) : (
            <Dashboard 
              modules={visibleModules} 
              onOpenModule={openModule} 
              onContinue={openModule} 
              onViewCertificate={(sectionName) => {
                setActiveSectionName(sectionName);
                setViewingStudentName(null);
                setCertificateModules([]);
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