export default function TagFilterBar({ tags, activeTag, onChange }) {
  if (tags.length === 0) return null;

  return (
    <div className="border-b border-zinc-800/60 px-6 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 px-3 py-1 text-xs rounded-full transition-colors ${
          activeTag === null
            ? 'bg-zinc-100 text-zinc-900 font-medium'
            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'
        }`}
      >
        All
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onChange(activeTag === tag ? null : tag)}
          className={`flex-shrink-0 px-3 py-1 text-xs rounded-full transition-colors ${
            activeTag === tag
              ? 'bg-zinc-100 text-zinc-900 font-medium'
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
