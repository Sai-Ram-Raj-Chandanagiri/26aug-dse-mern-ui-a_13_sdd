import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import useDiscussionStore from "../store/discussionStore.js";
import { announce } from "../lib/announce.js";

// Community browse/search page (US4) — keyword search + paginated results (FR-016, FR-025)
export default function CommunityBrowse() {
  const results = useDiscussionStore((state) => state.communityResults);
  const isLoading = useDiscussionStore((state) => state.isLoading);
  const searchCommunities = useDiscussionStore((state) => state.searchCommunities);
  const joinCommunity = useDiscussionStore((state) => state.joinCommunity);

  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    searchCommunities({ query: activeQuery || undefined, page }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setActiveQuery(queryInput.trim());
  }

  async function handleJoin(community) {
    setJoiningId(community.id);
    try {
      await joinCommunity(community.id);
      toast.success(`Joined ${community.name}.`);
      announce(`Joined ${community.name}.`);
    } catch (envelope) {
      announce(envelope?.message || "Could not join this community.");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Browse communities</h1>
        <div className="flex gap-3 text-sm">
          <Link to="/invitations" className="underline">
            My invitations
          </Link>
          <Link
            to="/communities/new"
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
          >
            Create community
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2" role="search">
        <label htmlFor="community-search" className="sr-only">
          Search communities
        </label>
        <input
          id="community-search"
          type="search"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search by name or description"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2"
        />
        <button type="submit" className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground">
          Search
        </button>
      </form>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && results.items.length === 0 && (
        <p role="status" className="text-muted-foreground">
          No results found.
        </p>
      )}

      <ul className="space-y-3">
        {results.items.map((community) => (
          <li key={community.id} className="rounded-md border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link to={`/communities/${community.id}`} className="text-lg font-medium underline">
                  {community.name}
                </Link>
                <p className="text-sm text-muted-foreground">{community.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {community.visibility === "private" ? "Private" : "Public"} · {community.memberCount} member
                  {community.memberCount === 1 ? "" : "s"}
                </p>
              </div>
              {community.isMember ? (
                <span className="shrink-0 text-sm text-muted-foreground">Member</span>
              ) : (
                community.visibility === "public" && (
                  <button
                    type="button"
                    onClick={() => handleJoin(community)}
                    disabled={joiningId === community.id}
                    className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {joiningId === community.id ? "Joining…" : "Join"}
                  </button>
                )
              )}
            </div>
          </li>
        ))}
      </ul>

      {results.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={results.page <= 1}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {results.page} of {results.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(results.totalPages, prev + 1))}
            disabled={results.page >= results.totalPages}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
