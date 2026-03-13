import { useState } from 'react';

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
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}

// X/Twitter logo SVG
function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export default function BookmarkCard({ bookmark, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const tweetId = bookmark.tweet_id;

  return (
    <article
      className={`group relative flex flex-col bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border transition-all duration-150 ${
        selected
          ? 'border-zinc-400 ring-1 ring-zinc-400/20'
          : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40'
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail / hover embed area */}
      <div className="aspect-video relative bg-zinc-800 overflow-hidden">
        {hovered && tweetId ? (
          <iframe
            src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark&chrome=noheader&nofooter=true`}
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
            title="Tweet preview"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-700">
            <XIcon size={24} />
          </div>
        )}

        {/* Hover overlay hint */}
        {!hovered && (
          <div className="absolute inset-0 group-hover:opacity-0 opacity-100 transition-opacity duration-200 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
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

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {bookmark.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] leading-tight ${tagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-[10px] text-zinc-700 self-center">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
