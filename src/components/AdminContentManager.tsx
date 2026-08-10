import { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, Loader2, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
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
  
  // Visual state for building questions easily
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchingModules, setFetchingModules] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch all existing modules on load
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

  // Handle switching between "Create New" and an existing module
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
        
        // Parse incoming quiz JSON back into visual builder state if it exists
        if (found.quiz && Array.isArray(found.quiz.questions)) {
          setQuestions(found.quiz.questions);
        } else {
          setQuestions([]);
        }
      }
    }
  }

  // Quiz question helper functions
  function handleAddQuestion() {
    setQuestions([...questions, { question: '', options: ['', ''], correctAnswer: 0 }]);
  }

  function handleRemoveQuestion(qIndex: number) {
    setQuestions(questions.filter((_, i) => i !== qIndex));
  }

  function handleQuestionTextChange(qIndex: number, text: string) {
    const updated = [...questions];
    updated[qIndex].question = text;
    setQuestions(updated);
  }

  function handleAddOption(qIndex: number) {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  }

  function handleRemoveOption(qIndex: number, oIndex: number) {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    if (updated[qIndex].correctAnswer >= updated[qIndex].options.length) {
      updated[qIndex].correctAnswer = Math.max(0, updated[qIndex].options.length - 1);
    }
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

    // Automatically format visual questions into the required Supabase JSONB structure
    let formattedQuiz = null;
    if (questions.length > 0) {
      formattedQuiz = {
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      };
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

      {/* Module Selector Dropdown */}
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

        {/* Visual Quiz Builder Section */}
        <div className="pt-4 border-t border-ink-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-bold text-ink-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-600" /> Quiz Builder
              </label>
              <p className="text-xs text-ink-500">Add questions and select the correct answer. This auto-formats into Supabase JSON.</p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="p-6 bg-ink-50/50 rounded-xl border border-dashed border-ink-200 text-center text-xs text-ink-400 italic">
              No quiz questions added yet. Click "Add Question" above to start building.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 rounded-xl border border-ink-200 bg-ink-50/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {qIndex + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      placeholder="Enter question text..."
                      className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="pl-8 space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Answer Options (Select the radio button for the correct answer)
                    </label>
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === oIndex}
                          onChange={() => handleSetCorrectAnswer(qIndex, oIndex)}
                          className="w-4 h-4 text-brand-600 accent-brand-600 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}...`}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none bg-white ${
                            q.correctAnswer === oIndex 
                              ? 'border-emerald-500 ring-1 ring-emerald-500 font-medium text-emerald-900' 
                              : 'border-ink-200 focus:border-brand-500'
                          }`}
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="text-ink-400 hover:text-red-600 p-1"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-1 inline-flex items-center gap-1"
                    >
                      + Add Option
                    </button>
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