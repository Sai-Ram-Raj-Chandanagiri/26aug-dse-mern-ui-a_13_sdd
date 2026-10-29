import { useEffect, useState } from "react";
import engagementApi from "../../api/engagementApi.js";
import { announce } from "../../lib/announce.js";

// Like toggle (US9) — one like per user per item (FR-026). The count updates optimistically and is
// then reconciled with the authoritative `likeCount` the server returns; a rejected duplicate like
// (e.g. another tab already liked it) settles the button into the liked state instead of reverting.
export default function LikeButton({ targetType, targetId, likeCount = 0, liked = false, disabled = false }) {
  const [count, setCount] = useState(likeCount);
  const [isLiked, setIsLiked] = useState(liked);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setCount(likeCount);
    setIsLiked(liked);
  }, [likeCount, liked, targetId]);

  async function handleToggle() {
    if (isPending || disabled) return;

    const wasLiked = isLiked;
    const previousCount = count;

    setIsLiked(!wasLiked);
    setCount(Math.max(0, previousCount + (wasLiked ? -1 : 1)));
    setIsPending(true);

    try {
      const { data } = wasLiked
        ? await engagementApi.unlike({ targetType, targetId })
        : await engagementApi.like({ targetType, targetId });

      if (typeof data?.likeCount === "number") {
        setCount(data.likeCount);
      }
      announce(wasLiked ? "Like removed." : "Liked.");
    } catch (envelope) {
      if (envelope?.code === "DUPLICATE_LIKE") {
        setIsLiked(true);
        setCount(previousCount);
      } else {
        setIsLiked(wasLiked);
        setCount(previousCount);
      }
      announce(envelope?.message || "Could not update like.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      aria-pressed={isLiked}
      aria-label={isLiked ? `Unlike, ${count} likes` : `Like, ${count} likes`}
      className={`rounded-md border border-border px-2.5 py-1 text-sm font-medium disabled:opacity-60 ${
        isLiked ? "bg-primary text-primary-foreground" : ""
      }`}
    >
      ♥ {count}
    </button>
  );
}
