import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { importBookmarks } from '../api.js';

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function ImportModal({ onClose, onSuccess }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((files) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        // Accept either a plain array or { bookmarks: [...] }
        const bookmarks = Array.isArray(json) ? json : json.bookmarks;
        if (!Array.isArray(bookmarks)) {
          throw new Error('Expected an array or an object with a "bookmarks" array.');
        }
        setParsed(bookmarks);
        setParseError(null);
      } catch (err) {
        setParseError(err.message);
        setParsed(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false,
  });

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const res = await importBookmarks(parsed);
      setResult(res);
    } catch (err) {
      setParseError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Import Bookmarks</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {result ? (
            /* Success state */
            <div className="py-6 text-center space-y-3">
              <p className="text-zinc-100 font-medium">
                {result.imported} bookmark{result.imported !== 1 ? 's' : ''} imported
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-zinc-600">
                  {result.skipped} duplicate{result.skipped !== 1 ? 's' : ''} skipped
                </p>
              )}
              <button
                onClick={onSuccess}
                className="mt-2 px-5 py-2 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-white transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors select-none ${
                  isDragActive
                    ? 'border-zinc-400 bg-zinc-900'
                    : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50'
                }`}
              >
                <input {...getInputProps()} />
                {fileName ? (
                  <div>
                    <p className="text-sm text-zinc-300">{fileName}</p>
                    {parsed && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {parsed.length} bookmark{parsed.length !== 1 ? 's' : ''} found
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-500">
                      {isDragActive ? 'Drop it here' : 'Drag & drop a JSON file'}
                    </p>
                    <p className="text-xs text-zinc-700">or click to browse</p>
                  </div>
                )}
              </div>

              {/* Format hint */}
              <p className="text-xs text-zinc-700">
                Expects a JSON array or{' '}
                <code className="text-zinc-600">{'{ "bookmarks": [...] }'}</code>
              </p>

              {/* Error */}
              {parseError && (
                <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
                  {parseError}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!parsed || importing}
                  className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md text-xs font-medium hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing…' : `Import${parsed ? ` ${parsed.length}` : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
