import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ModuleType = 'video' | 'document';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface TrainingModule {
  id: string;
  section: string;
  title: string;
  description: string;
  type: ModuleType;
  content_url: string;
  duration_minutes: number;
  order_index: number;
  created_at: string;
}

export interface Progress {
  id: string;
  module_id: string;
  status: ProgressStatus;
  completed_at: string | null;
  last_viewed_at: string | null;
  updated_at: string;
}

export interface ModuleWithProgress extends TrainingModule {
  progress: Progress | null;
}
