import BookmarkCard from './BookmarkCard.jsx';

export default function BookmarkGrid({ bookmarks, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {bookmarks.map(bookmark => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          selected={bookmark.id === selectedId}
          onClick={() => onSelect(bookmark)}
        />
      ))}
    </div>
  );
}
