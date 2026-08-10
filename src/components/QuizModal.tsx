import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface QuizModalProps {
  quiz: any;
  onPass: (score: number) => void;
  onRetry: () => void;
}

export function QuizModal({ quiz, onPass, onRetry }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Robustly normalize incoming quiz data (handles strings, objects, and arrays)
  let parsedQuiz = quiz;
  if (typeof quiz === 'string') {
    try {
      parsedQuiz = JSON.parse(quiz);
    } catch (e) {
      parsedQuiz = [];
    }
  }

  const rawQuestions = Array.isArray(parsedQuiz)
    ? parsedQuiz
    : (parsedQuiz && typeof parsedQuiz === 'object' && Array.isArray(parsedQuiz.questions))
      ? parsedQuiz.questions
      : [];

  // Normalize questions to guarantee standard structure with a valid numerical `correctAnswer` index
  const quizQuestions = rawQuestions.map((q: any) => {
    const options = Array.isArray(q.options) ? q.options : [];
    let correctIndex = 0;

    if (typeof q.correctAnswer === 'number') {
      correctIndex = q.correctAnswer;
    } else if (typeof q.correct_answer === 'number') {
      correctIndex = q.correct_answer;
    } else if (typeof q.correct === 'number') {
      correctIndex = q.correct;
    } else if (typeof q.correct === 'string') {
      // If stored as text string, find its index in options
      const foundIdx = options.indexOf(q.correct);
      correctIndex = foundIdx !== -1 ? foundIdx : 0;
    }

    return {
      question: q.question || 'Untitled Question',
      options,
      correctAnswer: correctIndex,
    };
  });

  if (quizQuestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-6 text-center max-w-xl mx-auto shadow-sm">
        <p className="text-sm text-ink-500">No quiz questions available for this module yet.</p>
      </div>
    );
  }

  const currentQ = quizQuestions[currentIndex];

  if (!currentQ || !Array.isArray(currentQ.options) || currentQ.options.length === 0) {
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
    const isCorrect = selectedOption === currentQ.correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (currentIndex + 1 < quizQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
      const finalScorePercentage = Math.round((newScore / quizQuestions.length) * 100);
      
      // Enforce 100% perfect score to pass
      if (finalScorePercentage === 100) {
        onPass(finalScorePercentage);
      } else {
        onRetry();
      }
    }
  }

  if (quizFinished) {
    const finalPercentage = Math.round((score / quizQuestions.length) * 100);
    const passed = finalPercentage === 100;
    return (
      <div className="bg-white rounded-xl border border-ink-200/70 p-6 text-center max-w-lg mx-auto shadow-sm">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-bold text-ink-900">{passed ? 'Quiz Passed (100% Correct)!' : '100% Required to Pass'}</h3>
        <p className="text-sm text-ink-500 mt-1">
          You scored {score} out of {quizQuestions.length} ({finalPercentage}%). {passed ? '' : 'You must get every question correct to unlock completion.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-ink-200/70 p-6 max-w-xl mx-auto shadow-sm">
      <div className="flex justify-between items-center text-xs font-semibold text-ink-400 uppercase tracking-wider mb-4">
        <span>Question {currentIndex + 1} of {quizQuestions.length}</span>
        <span>Score: {score}</span>
      </div>

      <h3 className="text-base font-semibold text-ink-900 mb-4">{currentQ.question}</h3>

      <div className="space-y-2.5 mb-6">
        {currentQ.options.map((option: string, idx: number) => {
          let styling = "border-ink-200 hover:border-brand-400 bg-ink-50/50 text-ink-800";
          if (showResult) {
            if (idx === currentQ.correctAnswer) styling = "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold";
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
            <span>{currentIndex + 1 < quizQuestions.length ? 'Next Question' : 'Finish Quiz'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}