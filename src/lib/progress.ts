import type { ModuleWithProgress, ProgressStatus } from './supabase';

export function statusOf(module: ModuleWithProgress): ProgressStatus {
  return module.progress?.status ?? 'not_started';
}

export function isComplete(module: ModuleWithProgress): boolean {
  return statusOf(module) === 'completed';
}

export function isInProgress(module: ModuleWithProgress): boolean {
  return statusOf(module) === 'in_progress';
}

export function sectionProgress(modules: ModuleWithProgress[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = modules.length;
  const completed = modules.filter(isComplete).length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function overallProgress(modules: ModuleWithProgress[]): {
  completed: number;
  total: number;
  percent: number;
} {
  return sectionProgress(modules);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
