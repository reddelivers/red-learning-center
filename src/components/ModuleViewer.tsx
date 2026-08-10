import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, PlayCircle, RotateCcw, Award } from 'lucide-react';
import type { ModuleWithProgress } from '@/lib/supabase';
import { formatDuration, statusOf } from '@/lib/progress';
import { QuizModal } from '@/components/QuizModal';

interface ModuleViewerProps {
  module: ModuleWithProgress;
  onBack: () => void;
  onMarkComplete: (moduleId: string) => void;
  isSaving: boolean;
}

export function ModuleViewer({ module, onBack, onMarkComplete, isSaving }: ModuleViewerProps) {
  const completed = statusOf(module) === 'completed';
  const hasQuiz = Array.isArray(module.quiz) && module.quiz.length > 0;
  
  // Track if quiz is passed if the module has one
  const [quizPassed, setQuizPassed] = useState(completed);

  return (
    <div className="animate-scale-in">
      <button onClick={onBack} className="btn-ghost -ml-3 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to overview
      </button>

      <div className="max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
              {module.type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {module.type} · {module.section}
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-ink-950">{module.title}</h2>
            <p className="mt-2 text-ink-500 max-w-2xl">{module.description}</p>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
              <Clock className="w-4 h-4" />
              {formatDuration(module.duration_minutes)} estimated
            </div>
          </div>
          {completed && (
            <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          {module.type === 'video' ? (
            <div className="aspect-video bg-ink-950">
              <iframe
                src={module.content_url}
                title={module.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="h-[520px] bg-ink-100">
              <iframe src={module.content_url} title={module.title} className="w-full h-full" />
            </div>
          )}

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-ink-100">
            <div>
              <p className="text-sm font-semibold text-ink-800">
                {completed ? 'You have completed this module.' : hasQuiz && !quizPassed ? 'Pass the quiz to complete this module.' : 'Finished reviewing this module?'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {completed ? 'You can revisit it anytime from the training menu.' : 'Complete all materials and assessments to record progress.'}
              </p>
            </div>
            <button
              onClick={() => onMarkComplete(module.id)}
              disabled={isSaving || (hasQuiz && !quizPassed && !completed)}
              className={completed ? 'btn-secondary' : 'btn-primary'}
            >
              {completed ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSaving ? 'Saving...' : completed ? 'Mark as incomplete' : 'Mark as complete'}
            </button>
          </div>
        </div>

        {/* Render Quiz Section if module has quiz data */}
        {hasQuiz && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-bold text-ink-900">Module Knowledge Check</h3>
            </div>
            <QuizModal
              quiz={module.quiz}
              onPass={() => {
                setQuizPassed(true);
                onMarkComplete(module.id); // Automatically mark complete upon passing
              }}
              onRetry={() => setQuizPassed(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}