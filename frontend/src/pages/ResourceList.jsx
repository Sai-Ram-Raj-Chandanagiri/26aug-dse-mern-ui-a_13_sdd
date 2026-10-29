import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useCommunityStore from "../store/communityStore.js";
import useResourceStore from "../store/resourceStore.js";
import { announce } from "../lib/announce.js";
import EmptyState from "../components/common/EmptyState.jsx";
import ReportButton from "../components/moderation/ReportButton.jsx";
import LikeButton from "../components/common/LikeButton.jsx";
import BookmarkButton from "../components/common/BookmarkButton.jsx";

const RESOURCE_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "link", label: "Link" },
  { value: "file", label: "File" },
];

const emptyForm = { type: "link", title: "", url: "", file: null };

// Community resource list + share form (US5) — link/article/video/file variants, type filter,
// and keyword search, mirroring the discussion thread's member-gated layout.
export default function ResourceList() {
  const { id } = useParams();

  const community = useCommunityStore((state) => state.community);
  const loadCommunity = useCommunityStore((state) => state.loadCommunity);

  const resources = useResourceStore((state) => state.resources);
  const loadResources = useResourceStore((state) => state.loadResources);
  const createResource = useResourceStore((state) => state.createResource);

  const [isMember, setIsMember] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  // Optimistically drops reported items client-side (FR-028: hidden for this reporter only, so
  // the next full reload will also exclude them via the server-side per-reporter query filter)
  const [hiddenResourceIds, setHiddenResourceIds] = useState([]);

  function hideResource(resourceId) {
    setHiddenResourceIds((prev) => [...prev, resourceId]);
  }

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
    loadResources(id, { query: activeQuery || undefined, type: typeFilter || undefined, page }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeQuery, typeFilter, page, notFound]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setActiveQuery(queryInput.trim());
  }

  function handleTypeFilterChange(event) {
    setPage(1);
    setTypeFilter(event.target.value);
  }

  async function handleShare(event) {
    event.preventDefault();
    setError("");
    setIsSharing(true);
    try {
      await createResource(id, form);
      setForm(emptyForm);
      toast.success("Resource shared.");
      announce("Resource shared.");
    } catch (envelope) {
      const message = envelope?.message || "Could not share this resource.";
      setError(message);
      announce(message);
    } finally {
      setIsSharing(false);
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
      <header className="mb-6">
        <Link to={`/communities/${id}`} className="text-sm underline">
          Back to community
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{community.name} — Resources</h1>
      </header>

      {isMember && (
        <section className="mb-8 rounded-md border border-border p-4">
          <h2 className="mb-3 text-lg font-semibold">Share a resource</h2>
          <form noValidate onSubmit={handleShare} className="space-y-3">
            <div>
              <label htmlFor="resource-type" className="mb-1 block text-sm font-medium">
                Type
              </label>
              <select
                id="resource-type"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {RESOURCE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="resource-title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input
                id="resource-title"
                type="text"
                required
                maxLength={200}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </div>
            {form.type === "file" ? (
              <div>
                <label htmlFor="resource-file" className="mb-1 block text-sm font-medium">
                  File (max 10 MB)
                </label>
                <input
                  id="resource-file"
                  type="file"
                  required
                  onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="resource-url" className="mb-1 block text-sm font-medium">
                  URL
                </label>
                <input
                  id="resource-url"
                  type="url"
                  required
                  value={form.url}
                  onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSharing}
              className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
            >
              {isSharing ? "Sharing…" : "Share resource"}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Resources</h2>

        <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2" role="search">
          <label htmlFor="resource-search" className="sr-only">
            Search resources
          </label>
          <input
            id="resource-search"
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search resources"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2"
          />
          <label htmlFor="resource-type-filter" className="sr-only">
            Filter by type
          </label>
          <select
            id="resource-type-filter"
            value={typeFilter}
            onChange={handleTypeFilterChange}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="">All types</option>
            {RESOURCE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium">
            Search
          </button>
        </form>

        {resources.items.filter((resource) => !hiddenResourceIds.includes(resource.id)).length === 0 ? (
          <EmptyState message="No results found." />
        ) : (
          <ul className="space-y-3">
            {resources.items
              .filter((resource) => !hiddenResourceIds.includes(resource.id))
              .map((resource) => (
                <li key={resource.id} className="rounded-md border border-border p-4">
                  <a
                    href={resource.url || resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    {resource.title}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.type} · {resource.author?.displayName || "Unknown"} ·{" "}
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <LikeButton
                      targetType="resource"
                      targetId={resource.id}
                      likeCount={resource.likeCount ?? 0}
                      disabled={!isMember}
                    />
                    <BookmarkButton targetType="resource" targetId={resource.id} disabled={!isMember} />
                    <ReportButton targetType="resource" targetId={resource.id} onReported={hideResource} />
                  </div>
                </li>
              ))}
          </ul>
        )}

        {resources.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={resources.page <= 1}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {resources.page} of {resources.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(resources.totalPages, prev + 1))}
              disabled={resources.page >= resources.totalPages}
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
