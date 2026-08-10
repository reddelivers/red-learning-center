import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface Question {
  question: string;
  options?: string[];
  correctIndex: number;
}

interface QuizModalProps {
  quiz: Question[];
  onPass: (score: number) => void;
  onRetry: () => void;
}

export function QuizModal({ quiz, onPass }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Safety check: if quiz is empty or invalid, display a friendly note
  if (!Array.isArray(quiz) || quiz.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-6 text-center max-w-xl mx-auto shadow-sm">
        <p className="text-sm text-ink-500">No quiz questions available for this module yet.</p>
      </div>
    );
  }

  const currentQ = quiz[currentIndex];

  // Safety check for individual question structure
  if (!currentQ || !Array.isArray(currentQ.options)) {
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-6 text-center max-w-xl mx-auto shadow-sm">
        <p className="text-sm text-red-600">This quiz has a formatting error. Please check the JSON structure in Supabase.</p>
      </div>
    );
  }

  function handleAnswer(index: number) {
    setSelectedOption(index);
    setShowResult(true);
  }

  function nextQuestion() {
    const isCorrect = selectedOption === currentQ.correctIndex;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (currentIndex + 1 < quiz.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
      const finalScorePercentage = Math.round((newScore / quiz.length) * 100);
      if (finalScorePercentage >= 70) {
        onPass(finalScorePercentage);
      }
    }
  }

  if (quizFinished) {
    const passed = Math.round((score / quiz.length) * 100) >= 70;
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-6 text-center max-w-lg mx-auto shadow-sm">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-bold text-ink-900">{passed ? 'Quiz Passed!' : 'Keep Practicing'}</h3>
        <p className="text-sm text-ink-500 mt-1">
          You scored {score} out of {quiz.length} ({Math.round((score / quiz.length) * 100)}%)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-ink-200/70 p-6 max-w-xl mx-auto shadow-sm">
      <div className="flex justify-between items-center text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4">
        <span>Question {currentIndex + 1} of {quiz.length}</span>
        <span>Score: {score}</span>
      </div>

      <h3 className="text-base font-semibold text-ink-900 mb-4">{currentQ.question}</h3>

      <div className="space-y-2.5 mb-6">
        {currentQ.options.map((option, idx) => {
          let styling = "border-ink-200 hover:border-brand-400 bg-ink-50/50 text-ink-800";
          if (showResult) {
            if (idx === currentQ.correctIndex) styling = "border-emerald-300 bg-emerald-50 text-emerald-900";
            else if (idx === selectedOption) styling = "border-red-300 bg-red-50 text-red-900";
          }

          return (
            <button
              key={idx}
              disabled={showResult}
              onClick={() => handleAnswer(idx)}
              className={`w-full text-left p-3.5 rounded-lg border text-sm font-medium transition-all ${styling}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="flex justify-end">
          <button onClick={nextQuestion} className="btn-primary flex items-center gap-2">
            <span>{currentIndex + 1 < quiz.length ? 'Next Question' : 'Finish Quiz'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}