import type { ReactNode } from 'react';
import type { ModuleWithProgress } from '@/lib/supabase';
import { overallProgress, sectionProgress, formatDuration } from '@/lib/progress';
import { CheckCircle2, Clock, PlayCircle, FileText, TrendingUp, Award, BookOpen } from 'lucide-react';

interface DashboardProps {
  modules: ModuleWithProgress[];
  onOpenModule: (moduleId: string) => void;
  onContinue: (moduleId: string) => void;
  onViewCertificate: (sectionName: string) => void;
}

export function Dashboard({ modules, onOpenModule, onContinue, onViewCertificate }: DashboardProps) {
  const overall = overallProgress(modules);
  const inProgressModules = modules.filter((m) => m.progress?.status === 'in_progress');
  const continueWith = inProgressModules[0] ?? modules.find((m) => !m.progress || m.progress.status === 'not_started');

  const sections = Array.from(new Set(modules.map((m) => m.section)));
  const sectionStats = sections.map((s) => ({
    section: s,
    ...sectionProgress(modules.filter((m) => m.section === s)),
  }));

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-7 lg:p-9 shadow-lg shadow-brand-700/20">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-8 bottom-0 w-40 h-40 rounded-full bg-brand-400/20 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-brand-100">Welcome back</p>
          <h2 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight">Your training journey</h2>
          <p className="mt-2 text-sm text-brand-100/90 max-w-md">
            Track your progress through every video and document. Pick up where you left off and work toward completion.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums">{overall.percent}%</span>
                <span className="text-sm text-brand-100 mb-1">complete</span>
              </div>
              <div className="mt-2 w-56 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${overall.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-brand-100/80">
                {overall.completed} of {overall.total} modules done
              </p>
            </div>

            {continueWith && (
              <button
                onClick={() => onContinue(continueWith.id)}
                className="btn bg-white text-brand-700 hover:bg-brand-50 active:scale-[0.98] shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                {inProgressModules.length > 0 ? 'Continue training' : 'Start training'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="In progress"
          value={inProgressModules.length}
          tint="text-brand-600 bg-brand-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={overall.completed}
          tint="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Total modules"
          value={overall.total}
          tint="text-ink-700 bg-ink-100"
        />
      </div>

      {/* Section progress & Certificates */}
      <div>
        <h3 className="text-lg font-bold text-ink-900 mb-4">Sections & Certificates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionStats.map((s) => {
            const isCompleted = s.total > 0 && s.completed === s.total;
            return (
              <div key={s.section} className="card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-ink-900">{s.section}</h4>
                    <span className="text-sm font-medium text-ink-500 tabular-nums">
                      {s.completed}/{s.total}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-500">{s.percent}% complete</p>
                </div>

                <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-500">
                    {isCompleted ? 'Certificate unlocked!' : 'Complete section for certificate'}
                  </span>
                  <button
                    onClick={() => onViewCertificate(s.section)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'View Certificate' : 'Check Status'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue / start list */}
      {continueWith && (
        <div>
          <h3 className="text-lg font-bold text-ink-900 mb-4">
            {inProgressModules.length > 0 ? 'Keep going' : 'Get started'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(inProgressModules.length > 0 ? inProgressModules : modules.filter((m) => !m.progress || m.progress.status === 'not_started').slice(0, 3)).map((m) => (
              <button
                key={m.id}
                onClick={() => onOpenModule(m.id)}
                className="card p-5 text-left hover:shadow-md hover:border-brand-300 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                    m.type === 'video' ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-600'
                  }`}>
                    {m.type === 'video' ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ink-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(m.duration_minutes)}
                  </span>
                </div>
                <h4 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                  {m.title}
                </h4>
                <p className="mt-1 text-sm text-ink-500 line-clamp-2">{m.description}</p>
                <p className="mt-3 text-xs font-medium text-brand-600">{m.section}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Achievement banner when complete */}
      {overall.completed > 0 && overall.completed === overall.total && (
        <div className="card p-6 flex items-center gap-4 bg-emerald-50 border-emerald-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900">Training complete!</h4>
            <p className="text-sm text-emerald-700">You've finished every module. Great work.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink-900 tabular-nums">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </div>
  );
}