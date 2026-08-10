import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, PlayCircle, RotateCcw, Award, AlertCircle } from 'lucide-react';
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
  
  // Normalize quiz extraction (supports arrays, stringified JSON, or { questions: [...] } objects from Supabase)
  let rawQuiz = module.quiz;
  if (typeof rawQuiz === 'string') {
    try {
      rawQuiz = JSON.parse(rawQuiz);
    } catch (e) {
      rawQuiz = [];
    }
  }

  const quizQuestions = Array.isArray(rawQuiz) 
    ? rawQuiz 
    : (rawQuiz && typeof rawQuiz === 'object' && Array.isArray((rawQuiz as any).questions)) 
      ? (rawQuiz as any).questions 
      : [];

  const hasQuiz = quizQuestions.length > 0;
  
  // Track if quiz is passed if the module has one
  const [quizPassed, setQuizPassed] = useState(completed);

  // Determine if the completion action should be blocked
  const isBlockedByQuiz = hasQuiz && !quizPassed && !completed;

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
                {completed 
                  ? 'You have completed this module.' 
                  : isBlockedByQuiz 
                    ? 'A 100% perfect score on the quiz is required to complete this module.' 
                    : 'Finished reviewing this module?'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {completed 
                  ? 'You can revisit it anytime from the training menu.' 
                  : isBlockedByQuiz 
                    ? 'Please pass the quiz below with all correct answers to unlock completion.' 
                    : 'Complete all materials to record progress.'}
              </p>
            </div>
            <button
              onClick={() => {
                if (!isBlockedByQuiz) {
                  onMarkComplete(module.id);
                }
              }}
              disabled={isSaving || isBlockedByQuiz}
              className={`${completed ? 'btn-secondary' : 'btn-primary'} ${isBlockedByQuiz ? 'opacity-50 cursor-not-allowed hover:bg-brand-600' : ''}`}
              title={isBlockedByQuiz ? 'Complete the quiz with 100% to unlock' : ''}
            >
              {completed ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSaving ? 'Saving...' : completed ? 'Mark as incomplete' : isBlockedByQuiz ? 'Quiz Required (100%)' : 'Mark as complete'}
            </button>
          </div>
        </div>

        {/* Render Quiz Section if module has quiz data */}
        {hasQuiz && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold text-ink-900">Module Knowledge Check</h3>
              </div>
              {quizPassed ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" /> Quiz Passed (100%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <AlertCircle className="w-4 h-4" /> 100% Score Required
                </span>
              )}
            </div>

            <QuizModal
              quiz={quizQuestions}
              onPass={() => {
                setQuizPassed(true);
                onMarkComplete(module.id); // Automatically mark complete upon achieving 100%
              }}
              onRetry={() => setQuizPassed(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}