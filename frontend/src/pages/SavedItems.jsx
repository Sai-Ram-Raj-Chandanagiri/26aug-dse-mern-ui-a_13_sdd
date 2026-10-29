import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useSavedItemsStore from "../store/savedItemsStore.js";
import EmptyState from "../components/common/EmptyState.jsx";
import BookmarkButton from "../components/common/BookmarkButton.jsx";

// Saved Items profile section (US10) — bookmarked discussions/resources, independent of
// likes/reporting; bookmarks whose target was admin-removed are already excluded by the server
// (FR-027), so every item rendered here is guaranteed to still be live.
export default function SavedItems() {
  const bookmarks = useSavedItemsStore((state) => state.bookmarks);
  const loadBookmarks = useSavedItemsStore((state) => state.loadBookmarks);
  const removeBookmark = useSavedItemsStore((state) => state.removeBookmark);

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBookmarks({ page }).catch(() => {});
  }, [loadBookmarks, page]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Saved items</h1>

      {bookmarks.items.length === 0 ? (
        <EmptyState message="You haven't saved anything yet." />
      ) : (
        <ul className="space-y-3">
          {bookmarks.items.map((bookmark) => (
            <li key={bookmark.id} className="rounded-md border border-border p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {bookmark.targetType}
              </p>
              {bookmark.targetType === "discussion" ? (
                <Link to={`/discussions/${bookmark.target.id}`} className="font-medium underline">
                  {bookmark.target.title}
                </Link>
              ) : (
                <a
                  href={bookmark.target.url || bookmark.target.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {bookmark.target.title}
                </a>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {bookmark.target.author?.displayName || "Unknown"} ·{" "}
                {new Date(bookmark.target.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <BookmarkButton
                  targetType={bookmark.targetType}
                  targetId={bookmark.targetId}
                  bookmarked
                  bookmarkId={bookmark.id}
                  onRemoved={removeBookmark}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {bookmarks.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={bookmarks.page <= 1}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {bookmarks.page} of {bookmarks.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(bookmarks.totalPages, prev + 1))}
            disabled={bookmarks.page >= bookmarks.totalPages}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
