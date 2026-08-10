import { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AdminContentManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('new');

  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [orderIndex, setOrderIndex] = useState('0');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [quizJson, setQuizJson] = useState('');
  
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
      setQuizJson('');
    } else {
      const found = modules.find((m) => m.id === id);
      if (found) {
        setTitle(found.title || '');
        setSection(found.section || '');
        setOrderIndex(String(found.order_index ?? 0));
        setDescription(found.description || '');
        setContentUrl(found.content_url || '');
        setDurationMinutes(String(found.duration_minutes ?? '15'));
        setQuizJson(found.quiz ? JSON.stringify(found.quiz, null, 2) : '');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    let parsedQuiz = null;
    if (quizJson.trim()) {
      try {
        parsedQuiz = JSON.parse(quizJson);
      } catch (err) {
        setError('Invalid JSON format in the quiz field.');
        setLoading(false);
        return;
      }
    }

    const payload = {
      title,
      section,
      order_index: parseInt(orderIndex, 10) || 0,
      description: description || null,
      content_url: contentUrl || null,
      duration_minutes: durationMinutes || null,
      quiz: parsedQuiz,
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
    <div className="max-w-2xl bg-white p-8 rounded-xl border border-ink-100 shadow-sm">
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">Quiz JSON (Optional)</label>
          <textarea
            rows={3}
            value={quizJson}
            onChange={(e) => setQuizJson(e.target.value)}
            placeholder='{"questions": [...] }'
            className="w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm font-mono text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
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