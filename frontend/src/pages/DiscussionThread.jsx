import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useDiscussionStore from "../store/discussionStore.js";
import { announce } from "../lib/announce.js";
import ReportButton from "../components/moderation/ReportButton.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import BookmarkButton from "../components/common/BookmarkButton.jsx";

// Discussion thread page (US4) — thread body, paginated comments, and a member-gated reply form
export default function DiscussionThread() {
  const { id } = useParams();

  const discussion = useDiscussionStore((state) => state.discussion);
  const comments = useDiscussionStore((state) => state.comments);
  const isMember = useDiscussionStore((state) => state.isMember);
  const loadDiscussion = useDiscussionStore((state) => state.loadDiscussion);
  const addComment = useDiscussionStore((state) => state.addComment);
  const resetThread = useDiscussionStore((state) => state.resetThread);

  const [page, setPage] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  // Optimistically drops reported items client-side (FR-028: hidden for this reporter only, so
  // the next full reload will also exclude them via the server-side per-reporter query filter)
  const [hiddenCommentIds, setHiddenCommentIds] = useState([]);

  function hideComment(commentId) {
    setHiddenCommentIds((prev) => [...prev, commentId]);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadDiscussion(id, { page });
        setNotFound(false);
      } catch {
        setNotFound(true);
      }
    })();
    return () => resetThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  async function handleReply(event) {
    event.preventDefault();
    setError("");
    setIsPosting(true);
    try {
      await addComment(id, reply);
      setReply("");
      toast.success("Reply posted.");
      announce("Reply posted.");
    } catch (envelope) {
      const message = envelope?.message || "Could not post reply.";
      setError(message);
      announce(message);
    } finally {
      setIsPosting(false);
    }
  }

  if (notFound) {
    return (
      <div role="alert" className="p-6">
        Discussion not found.
      </div>
    );
  }

  if (!discussion) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/communities/${discussion.community}`} className="text-sm underline">
        Back to community
      </Link>

      <article className="mt-4 rounded-md border border-border p-4">
        <h1 className="text-2xl font-semibold">{discussion.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {discussion.author?.displayName || "Unknown"} · {new Date(discussion.createdAt).toLocaleString()}
        </p>
        <p className="mt-4 whitespace-pre-wrap">{discussion.body}</p>
        <div className="mt-4 flex items-center gap-3">
          <LikeButton
            targetType="discussion"
            targetId={discussion.id}
            likeCount={discussion.likeCount ?? 0}
            disabled={!isMember}
          />
          <BookmarkButton targetType="discussion" targetId={discussion.id} disabled={!isMember} />
          <ReportButton targetType="discussion" targetId={discussion.id} />
        </div>
      </article>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">
          Replies ({comments.totalItems})
        </h2>

        {comments.items.filter((comment) => !hiddenCommentIds.includes(comment.id)).length === 0 ? (
          <p role="status" className="text-muted-foreground">
            No replies yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.items
              .filter((comment) => !hiddenCommentIds.includes(comment.id))
              .map((comment) => (
                <li key={comment.id} className="rounded-md border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    {comment.author?.displayName || "Unknown"} · {new Date(comment.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{comment.body}</p>
                  <div className="mt-2">
                    <ReportButton targetType="comment" targetId={comment.id} onReported={hideComment} />
                  </div>
                </li>
              ))}
          </ul>
        )}

        {comments.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={comments.page <= 1}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {comments.page} of {comments.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(comments.totalPages, prev + 1))}
              disabled={comments.page >= comments.totalPages}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Next
            </button>
          </nav>
        )}
      </section>

      {isMember ? (
        <form noValidate onSubmit={handleReply} className="mt-8 space-y-3">
          <label htmlFor="reply-body" className="block text-sm font-medium">
            Write a reply
          </label>
          <textarea
            id="reply-body"
            rows={3}
            required
            maxLength={2000}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPosting}
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
          >
            {isPosting ? "Posting…" : "Post reply"}
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Join this community to reply.</p>
      )}
    </div>
  );
}
