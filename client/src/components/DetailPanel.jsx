import { useState, useEffect, useRef } from 'react';
import { updateBookmark, deleteBookmark } from '../api.js';

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

const TAG_PALETTES = [
  'bg-blue-950 text-blue-400 border-blue-900',
  'bg-violet-950 text-violet-400 border-violet-900',
  'bg-emerald-950 text-emerald-400 border-emerald-900',
  'bg-amber-950 text-amber-400 border-amber-900',
  'bg-rose-950 text-rose-400 border-rose-900',
  'bg-teal-950 text-teal-400 border-teal-900',
  'bg-indigo-950 text-indigo-400 border-indigo-900',
  'bg-orange-950 text-orange-400 border-orange-900',
];

function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}

export default function DetailPanel({ bookmark, onClose, onUpdate, onDelete }) {
  const [tags, setTags] = useState(bookmark.tags ?? []);
  const [notes, setNotes] = useState(bookmark.notes ?? '');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const tagInputRef = useRef(null);

  // Sync when selected bookmark changes
  useEffect(() => {
    setTags(bookmark.tags ?? []);
    setNotes(bookmark.notes ?? '');
    setTagInput('');
    setSaveError(null);
  }, [bookmark.id]);

  const isDirty =
    JSON.stringify(tags) !== JSON.stringify(bookmark.tags) ||
    notes !== (bookmark.notes ?? '');

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateBookmark(bookmark.id, { tags, notes });
      onUpdate(updated);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this bookmark? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteBookmark(bookmark.id);
      onDelete(bookmark.id);
    } catch (err) {
      setSaveError(err.message);
      setDeleting(false);
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel — slides in from right */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col"
        style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800 gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">
              {bookmark.author_name || '@' + bookmark.author_handle}
            </p>
            <p className="text-xs text-zinc-500 truncate">@{bookmark.author_handle}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800"
              title="Open on X / Twitter"
            >
              <XIcon size={13} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Tweet embed */}
          {bookmark.tweet_id && (
            <div className="border-b border-zinc-800 overflow-hidden bg-black">
              <iframe
                key={bookmark.tweet_id}
                src={`https://platform.twitter.com/embed/Tweet.html?id=${bookmark.tweet_id}&theme=dark`}
                className="w-full border-0"
                style={{ height: 420 }}
                title="Tweet"
                sandbox="allow-scripts allow-same-origin allow-popups"
                loading="lazy"
              />
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                Tags
              </label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${tagColor(tag)}`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="opacity-50 hover:opacity-100 transition-opacity text-sm leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tag — press Enter or comma"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observations, techniques, references..."
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Tweet text (read only) */}
            {bookmark.tweet_text && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                  Tweet
                </label>
                <p className="text-xs text-zinc-600 leading-relaxed">{bookmark.tweet_text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>

          <div className="flex items-center gap-3">
            {saveError && (
              <span className="text-xs text-red-400">{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md text-xs font-medium hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
