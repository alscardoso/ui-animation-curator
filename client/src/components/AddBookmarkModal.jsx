import { useState, useRef, useEffect } from 'react';
import { createBookmark } from '../api.js';

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function AddBookmarkModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlRef = useRef(null);

  useEffect(() => {
    urlRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      await createBookmark(url.trim(), tags);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Add Bookmark</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL field */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Tweet URL
            </label>
            <input
              ref={urlRef}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://x.com/user/status/…"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Tags field */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Tags
              <span className="ml-1.5 normal-case font-normal text-zinc-700">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="css, spring, hover-effect"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md text-xs font-medium hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching metadata…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
