import { useEffect, useState } from "react";
import engagementApi from "../../api/engagementApi.js";
import { announce } from "../../lib/announce.js";

// Bookmark toggle (US10) — one saved item per user per target (FR-027). Unlike `LikeButton`, the
// DELETE verb needs the Bookmark's own id rather than the polymorphic target, so the id returned
// by `bookmark()` is tracked locally until the user un-saves it. `onRemoved` lets a saved-items
// list (which already knows the bookmark id up front) drop the item immediately on removal.
export default function BookmarkButton({
  targetType,
  targetId,
  bookmarked = false,
  bookmarkId = null,
  disabled = false,
  onRemoved,
}) {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [currentBookmarkId, setCurrentBookmarkId] = useState(bookmarkId);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsBookmarked(bookmarked);
    setCurrentBookmarkId(bookmarkId);
  }, [bookmarked, bookmarkId, targetId]);

  async function handleToggle() {
    if (isPending || disabled) return;

    const wasBookmarked = isBookmarked;
    setIsPending(true);

    try {
      if (wasBookmarked) {
        if (currentBookmarkId) {
          await engagementApi.unbookmark(currentBookmarkId);
        }
        setIsBookmarked(false);
        setCurrentBookmarkId(null);
        announce("Removed from saved items.");
        onRemoved?.(currentBookmarkId);
      } else {
        const { data } = await engagementApi.bookmark({ targetType, targetId });
        setIsBookmarked(true);
        setCurrentBookmarkId(data?.bookmark?.id ?? null);
        announce("Saved.");
      }
    } catch (envelope) {
      if (envelope?.code === "DUPLICATE_BOOKMARK") {
        setIsBookmarked(true);
      }
      announce(envelope?.message || "Could not update saved items.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Remove from saved items" : "Save for later"}
      className={`rounded-md border border-border px-2.5 py-1 text-sm font-medium disabled:opacity-60 ${
        isBookmarked ? "bg-primary text-primary-foreground" : ""
      }`}
    >
      {isBookmarked ? "★ Saved" : "☆ Save"}
    </button>
  );
}
