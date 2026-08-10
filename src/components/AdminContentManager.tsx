import { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, Loader2, CheckCircle, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export function AdminContentManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('new');

  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('15');
  
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchingModules, setFetchingModules] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      setFetchingModules(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('section')
        .order('order_index');

      if (!error && data) {
        setModules(data);
      }
      setFetchingModules(false);
    }
    void fetchModules();
  }, []);

  function handleSelectModuleChange(id: string) {
    setSelectedModuleId(id);
    setSuccess(false);
    setError(null);

    if (id === 'new') {
      setTitle('');
      setSection('');
      setOrderIndex('0');
      setDescription('');
      setContentUrl('');
      setDurationMinutes('15');
      setQuestions([]);
    } else {
      const found = modules.find((m) => m.id === id);
      if (found) {
        setTitle(found.title || '');
        setSection(found.section || '');
        setOrderIndex(String(found.order_index ?? 0));
        setDescription(found.description || '');
        setContentUrl(found.content_url || '');
        setDurationMinutes(String(found.duration_minutes ?? '15'));
        
        const rawQuiz = found.quiz;
        const loadedQuestions = Array.isArray(rawQuiz) 
          ? rawQuiz 
          : (rawQuiz && typeof rawQuiz === 'object' && Array.isArray(rawQuiz.questions))
            ? rawQuiz.questions
            : [];

        // Map loaded questions, checking both camelCase and snake_case or numeric indices
        setQuestions(
          loadedQuestions.map((q: any) => ({
            question: q.question || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: typeof q.correctAnswer === 'number' 
              ? q.correctAnswer 
              : typeof q.correct_answer === 'number' 
                ? q.correct_answer 
                : 0,
          }))
        );
      }
    }
  }

  function handleAddQuestion() {
    setQuestions([
      ...questions, 
      { question: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
  }

  function handleRemoveQuestion(qIndex: number) {
    setQuestions(questions.filter((_, i) => i !== qIndex));
  }

  function handleQuestionTextChange(qIndex: number, text: string) {
    const updated = [...questions];
    updated[qIndex].question = text;
    setQuestions(updated);
  }

  function handleOptionTextChange(qIndex: number, oIndex: number, text: string) {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  }

  function handleSetCorrectAnswer(qIndex: number, oIndex: number) {
    const updated = [...questions];
    updated[qIndex].correctAnswer = oIndex;
    setQuestions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Formats into the exact array structure with "options" first
    let formattedQuiz = null;
    if (questions.length > 0) {
      formattedQuiz = questions.map((q) => ({
        options: q.options.filter((opt) => opt.trim() !== ''),
        question: q.question,
        correctAnswer: q.correctAnswer,
      }));
    }

    const payload = {
      title,
      section,
      order_index: parseInt(orderIndex, 10) || 0,
      description: description || null,
      content_url: contentUrl || null,
      duration_minutes: durationMinutes || null,
      quiz: formattedQuiz,
    };

    if (selectedModuleId === 'new') {
      const { data, error: insertError } = await supabase.from('modules').insert(payload).select().single();
      setLoading(false);

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess(true);
        setSuccessMessage('Module successfully created and published!');
        if (data) {
          setModules((prev) => [...prev, data]);
          setSelectedModuleId(data.id);
        }
      }
    } else {
      const { error: updateError } = await supabase
        .from('modules')
        .update(payload)
        .eq('id', selectedModuleId);

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setSuccessMessage('Module successfully updated!');
        setModules((prev) =>
          prev.map((m) => (m.id === selectedModuleId ? { ...m, ...payload } : m))
        );
      }
    }
  }

  async function handleDelete() {
    if (selectedModuleId === 'new') return;
    const confirmDelete = window.confirm('Are you sure you want to delete this module? This action cannot be undone.');
    if (!confirmDelete) return;

    setDeleting(true);
    setError(null);
    setSuccess(false);

    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', selectedModuleId);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setModules((prev) => prev.filter((m) => m.id !== selectedModuleId));
      handleSelectModuleChange('new');
      setSuccess(true);
      setSuccessMessage('Module successfully deleted.');
    }
  }

  return (
    <div className="max-w-3xl bg-white p-8 rounded-xl border border-ink-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          {selectedModuleId === 'new' ? <PlusCircle className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink-900">
            {selectedModuleId === 'new' ? 'Add New Training Module' : 'Edit Training Module'}
          </h2>
          <p className="text-sm text-ink-500">Create new content, update, or remove modules in Supabase.</p>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-ink-100">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
          Select Module to Edit or Create New
        </label>
        <select
          value={selectedModuleId}
          onChange={(e) => handleSelectModuleChange(e.target.value)}
          disabled={fetchingModules}
          className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="new">+ Create New Module</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              [{m.section}] {m.title}
            </option>
          ))}
        </select>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to Navigation"
            className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Section *</label>
            <input
              type="text"
              required
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g., Flight Ops"
              className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Order Index</label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Duration</label>
            <input
              type="text"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g., 15 mins"
              className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Content URL (Optional)</label>
          <input
            type="text"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder="Video or resource link..."
            className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Module overview or text body..."
            className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Quiz Creator */}
        <div className="pt-4 border-t border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-600" /> Quiz Questions
              </label>
              <p className="text-xs text-ink-500">Click a box to mark which answer choice is correct (turns green).</p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="p-8 bg-ink-50 rounded-xl border border-dashed border-ink-200 text-center text-xs text-ink-400">
              No quiz questions added yet. Click <strong>Add Question</strong> to start.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-5 rounded-xl border border-ink-200 bg-ink-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-700">
                      Question #{qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Question
                    </button>
                  </div>

                  {/* Question Box */}
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-500 mb-1">Question Box</label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      placeholder="Type your question here..."
                      className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
                    />
                  </div>

                  {/* Answer Choice Boxes */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-ink-500">
                      Answer Choice Boxes <span className="text-emerald-600 font-normal">(Click the button on the left of the correct answer)</span>
                    </label>
                    {q.options.map((opt, oIndex) => {
                      const isCorrect = q.correctAnswer === oIndex;
                      return (
                        <div key={oIndex} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectAnswer(qIndex, oIndex)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              isCorrect 
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300' 
                                : 'bg-white border border-ink-200 text-ink-400 hover:border-ink-400'
                            }`}
                            title={isCorrect ? 'Correct Answer' : 'Click to mark as correct'}
                          >
                            {isCorrect ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + oIndex)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                            placeholder={`Answer choice ${oIndex + 1}...`}
                            className={`flex-1 rounded-lg border px-3.5 py-2 text-sm outline-none bg-white ${
                              isCorrect 
                                ? 'border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-medium' 
                                : 'border-ink-200 focus:border-brand-500'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {selectedModuleId === 'new' ? 'Publish Module' : 'Save Changes'}
          </button>

          {selectedModuleId !== 'new' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 text-sm"
              title="Delete Module"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}