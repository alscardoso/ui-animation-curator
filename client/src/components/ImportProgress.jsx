import { useState, useEffect } from 'react';
import { fetchImportStatus } from '../api.js';

export default function ImportProgress({ imported, skipped, onDone }) {
  const [status, setStatus] = useState({ total: 0, completed: 0, failed: 0, inProgress: true });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const s = await fetchImportStatus();
        if (!cancelled) setStatus(s);
      } catch {}
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const pct = status.total > 0 ? (status.completed / status.total) * 100 : 0;

  return (
    <div className="py-6 text-center space-y-4">
      {/* Import summary */}
      <div>
        <p className="text-zinc-100 font-medium">
          {imported} bookmark{imported !== 1 ? 's' : ''} imported
        </p>
        {skipped > 0 && (
          <p className="text-xs text-zinc-600 mt-1">
            {skipped} duplicate{skipped !== 1 ? 's' : ''} skipped
          </p>
        )}
      </div>

      {/* Download progress */}
      <div className="space-y-2.5">
        <p className="text-xs text-zinc-400">
          {status.inProgress
            ? `Downloading media… ${status.completed} / ${status.total}`
            : `Done — ${status.completed} downloaded, ${status.failed} unavailable`}
        </p>
        <div className="w-full bg-zinc-800 rounded-full h-0.5 overflow-hidden">
          <div
            className="bg-zinc-400 h-0.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {status.failed > 0 && status.inProgress && (
          <p className="text-xs text-zinc-700">{status.failed} failed so far</p>
        )}
      </div>

      {/* Close only available when queue is fully drained */}
      {!status.inProgress && (
        <button
          onClick={onDone}
          className="px-5 py-2 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-white transition-colors"
        >
          Done
        </button>
      )}
    </div>
  );
}
