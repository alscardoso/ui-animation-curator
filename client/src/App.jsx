import { useState, useEffect, useCallback } from 'react';
import { fetchBookmarks, fetchTags } from './api.js';
import TagFilterBar from './components/TagFilterBar.jsx';
import BookmarkGrid from './components/BookmarkGrid.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import ImportModal from './components/ImportModal.jsx';
import AddBookmarkModal from './components/AddBookmarkModal.jsx';

export default function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bms, tgs] = await Promise.all([fetchBookmarks(activeTag), fetchTags()]);
      setBookmarks(bms);
      setTags(tgs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookmarkUpdate = (updated) => {
    setBookmarks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    setSelectedBookmark(updated);
  };

  const handleBookmarkDelete = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    setSelectedBookmark(null);
  };

  const handleSelect = (bookmark) => {
    setSelectedBookmark(prev => (prev?.id === bookmark.id ? null : bookmark));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-zinc-600 text-xs font-mono">▶</span>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            UI Animation Curator
          </h1>
          {bookmarks.length > 0 && (
            <span className="text-xs text-zinc-600">{bookmarks.length}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-600 rounded-md transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md transition-colors"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Tag filter bar */}
      <TagFilterBar tags={tags} activeTag={activeTag} onChange={setActiveTag} />

      {/* Main content */}
      <main className="px-6 py-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-950/50 border border-red-900 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-600 text-sm">
            <span className="animate-pulse">Loading...</span>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-zinc-600 text-sm">No bookmarks yet.</p>
            <p className="text-zinc-700 text-xs max-w-xs">
              Paste a tweet URL with the{' '}
              <button
                onClick={() => setShowAdd(true)}
                className="text-zinc-500 hover:text-zinc-300 underline transition-colors"
              >
                + Add
              </button>{' '}
              button, or import a JSON export.
            </p>
          </div>
        ) : (
          <BookmarkGrid
            bookmarks={bookmarks}
            selectedId={selectedBookmark?.id}
            onSelect={handleSelect}
          />
        )}
      </main>

      {/* Slide-in detail panel */}
      {selectedBookmark && (
        <DetailPanel
          bookmark={selectedBookmark}
          onClose={() => setSelectedBookmark(null)}
          onUpdate={handleBookmarkUpdate}
          onDelete={handleBookmarkDelete}
        />
      )}

      {/* Modals */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadData(); }}
        />
      )}
      {showAdd && (
        <AddBookmarkModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadData(); }}
        />
      )}
    </div>
  );
}
