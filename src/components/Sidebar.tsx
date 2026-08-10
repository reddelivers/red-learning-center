import { GraduationCap, CheckCircle2, Clock, FileText, PlayCircle, PlusCircle, Users, UserPlus, ShieldAlert } from 'lucide-react';
import type { ModuleWithProgress } from '@/lib/supabase';
import { sectionProgress, formatDuration, statusOf } from '@/lib/progress';

interface SidebarProps {
  modules: ModuleWithProgress[];
  activeSection: string | null;
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onSelectSection: (section: string) => void;
  userRole?: string;
  currentView?: string;
  onSelectView?: (view: 'dashboard' | 'admin_content' | 'admin_learners' | 'admin_add_learner') => void;
}

function groupBySection(modules: ModuleWithProgress[]): { section: string; items: ModuleWithProgress[] }[] {
  const map = new Map<string, ModuleWithProgress[]>();
  for (const m of modules) {
    const list = map.get(m.section) ?? [];
    list.push(m);
    map.set(m.section, list);
  }
  return Array.from(map.entries()).map(([section, items]) => ({
    section,
    items: items.sort((a, b) => a.order_index - b.order_index),
  }));
}

export function Sidebar({
  modules,
  activeSection,
  activeModuleId,
  onSelectModule,
  onSelectSection,
  userRole,
  currentView = 'dashboard',
  onSelectView,
}: SidebarProps) {
  const sections = groupBySection(modules);
  
  // Dynamically check if the user has the admin role
  const isAdmin = userRole === 'admin';

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 lg:h-screen lg:sticky lg:top-0 bg-ink-950 text-ink-100 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center p-0 m-0 shadow-lg shadow-brand-600/30">
          <span className="text-sm font-bold text-center leading-none text-white">RLC</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">RED Learning Center</h1>
          <p className="text-xs text-ink-400">Training Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {isAdmin && onSelectView && (
          <div className="pb-4 border-b border-white/5 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-400 px-2 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Admin Controls
            </div>
            <button
              onClick={() => onSelectView('admin_content')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                currentView === 'admin_content'
                  ? 'bg-brand-600/20 text-white'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-brand-400" />
              <span>Manage Content</span>
            </button>
            <button
              onClick={() => onSelectView('admin_learners')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                currentView === 'admin_learners'
                  ? 'bg-brand-600/20 text-white'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-brand-400" />
              <span>Learner Progress & Certs</span>
            </button>
            <button
              onClick={() => onSelectView('admin_add_learner')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                currentView === 'admin_add_learner'
                  ? 'bg-brand-600/20 text-white'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 text-brand-400" />
              <span>Add New Learner</span>
            </button>
          </div>
        )}

        <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 px-2 mb-1">
          Training Modules
        </div>

        {sections.map((group) => {
          const { completed, total, percent } = sectionProgress(group.items);
          const isActiveSection = activeSection === group.section;
          return (
            <div key={group.section}>
              <button
                onClick={() => onSelectSection(group.section)}
                className="w-full flex items-center justify-between px-2 py-1.5 group"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 group-hover:text-ink-200 transition-colors">
                  {group.section}
                </span>
                <span className="text-[11px] text-ink-500 tabular-nums">
                  {completed}/{total}
                </span>
              </button>

              <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <ul className="mt-2 space-y-0.5">
                {group.items.map((m) => {
                  const status = statusOf(m);
                  const isActive = activeModuleId === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => onSelectModule(m.id)}
                        className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-brand-600/20 text-white'
                            : 'text-ink-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : m.type === 'video' ? (
                            <PlayCircle className={`w-4 h-4 ${isActive ? 'text-brand-300' : 'text-ink-500'}`} />
                          ) : (
                            <FileText className={`w-4 h-4 ${isActive ? 'text-brand-300' : 'text-ink-500'}`} />
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium leading-snug truncate">
                            {m.title}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5 text-[11px] text-ink-500">
                            <Clock className="w-3 h-3" />
                            {formatDuration(m.duration_minutes)}
                            {status === 'in_progress' && (
                              <span className="ml-1 text-brand-300 font-medium">In progress</span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {activeSection && (
        <div className="px-5 py-3 border-t border-white/5 text-[11px] text-ink-500">
          Viewing: {activeSection}
        </div>
      )}
    </aside>
  );
}