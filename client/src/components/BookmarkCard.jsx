import { useState, useEffect } from 'react';
import { fetchBookmarkById } from '../api.js';

// Deterministic color per tag name
const TAG_PALETTES = [
  'bg-blue-950 text-blue-400',
  'bg-violet-950 text-violet-400',
  'bg-emerald-950 text-emerald-400',
  'bg-amber-950 text-amber-400',
  'bg-rose-950 text-rose-400',
  'bg-teal-950 text-teal-400',
  'bg-indigo-950 text-indigo-400',
  'bg-orange-950 text-orange-400',
];

function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function BrokenLinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function BookmarkCard({ bookmark, selected, onClick, onUpdate }) {
  const [hovered, setHovered] = useState(false);

  const isPending     = bookmark.type === 'pending';
  const isUnavailable = !isPending && !bookmark.localPath;

  // Poll every 3s while media is pending
  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(async () => {
      try {
        const updated = await fetchBookmarkById(bookmark.id);
        if (updated.type !== 'pending') onUpdate?.(updated);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [bookmark.id, isPending, onUpdate]);

  const handleClick = () => {
    if (isPending) return;                         // no-op while downloading
    onClick?.();
  };

  return (
    <article
      className={`group relative flex flex-col bg-zinc-900 rounded-xl overflow-hidden border transition-all duration-150
        ${isPending ? 'cursor-default opacity-60' : 'cursor-pointer'}
        ${selected
          ? 'border-zinc-400 ring-1 ring-zinc-400/20'
          : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40'
        }`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Media area */}
      <div className="aspect-video relative bg-zinc-800 overflow-hidden">
        {isPending ? (
          // Shimmer while downloading
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        ) : isUnavailable ? (
          // Unavailable — clicking the card opens the tweet URL
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <BrokenLinkIcon />
          </div>
        ) : (
          <>
            {/* Thumbnail (static, shown when not hovering) */}
            {bookmark.thumbnailPath && !hovered && (
              <img
                src={bookmark.thumbnailPath}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Video preview on hover */}
            {hovered && bookmark.localPath && (
              <video
                src={bookmark.localPath}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {/* Fallback icon when no thumbnail yet and not hovering */}
            {!bookmark.thumbnailPath && !hovered && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <PlayIcon />
              </div>
            )}
          </>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2 flex-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-200 truncate leading-tight">
            {bookmark.author_name || '@' + bookmark.author_handle}
          </p>
          <p className="text-xs text-zinc-600">@{bookmark.author_handle}</p>
        </div>

        {bookmark.tweet_text && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {bookmark.tweet_text}
          </p>
        )}

        {bookmark.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bookmark.tags.slice(0, 3).map(tag => (
              <span key={tag} className={`inline-flex px-1.5 py-0.5 rounded text-[10px] leading-tight ${tagColor(tag)}`}>
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-[10px] text-zinc-700 self-center">+{bookmark.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
