import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useCommunityStore from "../store/communityStore.js";
import useDiscussionStore from "../store/discussionStore.js";
import useAuthStore from "../store/authStore.js";
import { announce } from "../lib/announce.js";
import EmptyState from "../components/common/EmptyState.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import BookmarkButton from "../components/common/BookmarkButton.jsx";

// Community detail page (US4) — join button plus the member-gated discussion list
export default function CommunityDetail() {
  const { id } = useParams();

  const currentUser = useAuthStore((state) => state.user);
  const community = useCommunityStore((state) => state.community);
  const loadCommunity = useCommunityStore((state) => state.loadCommunity);

  const discussions = useDiscussionStore((state) => state.discussions);
  const loadDiscussions = useDiscussionStore((state) => state.loadDiscussions);
  const createDiscussion = useDiscussionStore((state) => state.createDiscussion);
  const joinCommunity = useDiscussionStore((state) => state.joinCommunity);

  const [isMember, setIsMember] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isJoining, setIsJoining] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const isCommunityManager = Boolean(
    currentUser &&
      community &&
      (community.owner === currentUser.id || community.admins?.includes(currentUser.id))
  );

  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadCommunity(id);
        setIsMember(Boolean(loaded?.isMember));
        setNotFound(false);
      } catch {
        setNotFound(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (notFound) return;
    loadDiscussions(id, { query: activeQuery || undefined, page }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeQuery, page, notFound]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setActiveQuery(queryInput.trim());
  }

  async function handleJoin() {
    setIsJoining(true);
    try {
      await joinCommunity(id);
      setIsMember(true);
      toast.success("Joined community.");
      announce("Joined community.");
    } catch (envelope) {
      announce(envelope?.message || "Could not join this community.");
    } finally {
      setIsJoining(false);
    }
  }

  async function handlePost(event) {
    event.preventDefault();
    setError("");
    setIsPosting(true);
    try {
      await createDiscussion(id, form);
      setForm({ title: "", body: "" });
      toast.success("Posted.");
      announce("Discussion posted.");
    } catch (envelope) {
      const message = envelope?.message || "Could not post discussion.";
      setError(message);
      announce(message);
    } finally {
      setIsPosting(false);
    }
  }

  if (notFound) {
    return (
      <div role="alert" className="p-6">
        Community not found.
      </div>
    );
  }

  if (!community) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{community.name}</h1>
          <p className="text-sm text-muted-foreground">{community.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {community.visibility === "private" ? "Private" : "Public"} · {community.memberCount} member
            {community.memberCount === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <Link to={`/communities/${id}/resources`} className="underline">
              View resources
            </Link>
            {isCommunityManager && (
              <>
                <Link to={`/communities/${id}/edit`} className="underline">
                  Edit community
                </Link>
                <Link to={`/communities/${id}/invite`} className="underline">
                  Invite members
                </Link>
              </>
            )}
          </div>
        </div>
        {isMember ? (
          <span className="shrink-0 text-sm text-muted-foreground">You are a member</span>
        ) : (
          community.visibility === "public" && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isJoining}
              className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {isJoining ? "Joining…" : "Join community"}
            </button>
          )
        )}
      </header>

      {isMember && (
        <section className="mb-8 rounded-md border border-border p-4">
          <h2 className="mb-3 text-lg font-semibold">Start a discussion</h2>
          <form noValidate onSubmit={handlePost} className="space-y-3">
            <div>
              <label htmlFor="discussion-title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input
                id="discussion-title"
                type="text"
                required
                maxLength={200}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="discussion-body" className="mb-1 block text-sm font-medium">
                Body
              </label>
              <textarea
                id="discussion-body"
                rows={4}
                required
                maxLength={10000}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </div>
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
              {isPosting ? "Posting…" : "Post discussion"}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Discussions</h2>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2" role="search">
          <label htmlFor="discussion-search" className="sr-only">
            Search discussions
          </label>
          <input
            id="discussion-search"
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search discussions"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2"
          />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium">
            Search
          </button>
        </form>

        {discussions.items.length === 0 ? (
          <EmptyState message="No results found." />
        ) : (
          <ul className="space-y-3">
            {discussions.items.map((discussion) => (
              <li key={discussion.id} className="rounded-md border border-border p-4">
                <Link to={`/discussions/${discussion.id}`} className="font-medium underline">
                  {discussion.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {discussion.author?.displayName || "Unknown"} ·{" "}
                  {new Date(discussion.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <LikeButton
                    targetType="discussion"
                    targetId={discussion.id}
                    likeCount={discussion.likeCount ?? 0}
                    disabled={!isMember}
                  />
                  <BookmarkButton targetType="discussion" targetId={discussion.id} disabled={!isMember} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {discussions.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={discussions.page <= 1}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {discussions.page} of {discussions.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(discussions.totalPages, prev + 1))}
              disabled={discussions.page >= discussions.totalPages}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
