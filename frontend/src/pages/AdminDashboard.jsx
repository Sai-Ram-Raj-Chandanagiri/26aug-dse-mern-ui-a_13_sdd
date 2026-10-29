import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useDiscussionStore from "../store/discussionStore.js";
import useModerationStore from "../store/moderationStore.js";
import adminApi from "../api/adminApi.js";
import { announce } from "../lib/announce.js";

const emptyCommunityForm = { name: "", description: "", visibility: "public" };
const emptyUserForm = { userId: "", displayName: "", bio: "", role: "user" };

// Admin Dashboard (US6, US11) — community edit/delete/transfer-ownership, user edit/delete, and
// pending-reports moderation panels. Every action here is also enforced server-side by
// `requireAdmin` (Constitution Principle I); this page is a convenience UI, not the access-control
// boundary.
export default function AdminDashboard() {
  const communityResults = useDiscussionStore((state) => state.communityResults);
  const searchCommunities = useDiscussionStore((state) => state.searchCommunities);

  const reports = useModerationStore((state) => state.reports);
  const loadAdminReports = useModerationStore((state) => state.loadAdminReports);
  const dismissReport = useModerationStore((state) => state.dismissReport);
  const removeContent = useModerationStore((state) => state.removeContent);

  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [communityForm, setCommunityForm] = useState(emptyCommunityForm);
  const [transferTargets, setTransferTargets] = useState({});
  const [communityError, setCommunityError] = useState("");

  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userError, setUserError] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [reportsPage, setReportsPage] = useState(1);

  useEffect(() => {
    loadAdminReports({ status: "pending", page: reportsPage }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsPage]);

  useEffect(() => {
    searchCommunities({ query: activeQuery || undefined }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery]);

  function handleSearch(event) {
    event.preventDefault();
    setActiveQuery(queryInput.trim());
  }

  function startEdit(community) {
    setEditingId(community.id);
    setCommunityForm({
      name: community.name,
      description: community.description || "",
      visibility: community.visibility,
    });
    setCommunityError("");
  }

  async function handleUpdateCommunity(event, communityId) {
    event.preventDefault();
    setCommunityError("");
    try {
      await adminApi.updateCommunity(communityId, communityForm);
      toast.success("Community updated.");
      announce("Community updated.");
      setEditingId(null);
      await searchCommunities({ query: activeQuery || undefined });
    } catch (envelope) {
      const message = envelope?.message || "Could not update this community.";
      setCommunityError(message);
      announce(message);
    }
  }

  async function handleDeleteCommunity(communityId, force = false) {
    try {
      await adminApi.deleteCommunity(communityId, { force });
      toast.success("Community deleted.");
      announce("Community deleted.");
      await searchCommunities({ query: activeQuery || undefined });
    } catch (envelope) {
      if (envelope?.code === "UNRESOLVED_DISCUSSIONS") {
        const confirmed = window.confirm(
          `${envelope.message} Delete anyway and remove its unresolved discussions?`
        );
        if (confirmed) {
          await handleDeleteCommunity(communityId, true);
        }
        return;
      }
      const message = envelope?.message || "Could not delete this community.";
      toast.error(message);
      announce(message);
    }
  }

  async function handleTransferOwnership(event, communityId) {
    event.preventDefault();
    const newOwnerId = (transferTargets[communityId] || "").trim();
    if (!newOwnerId) return;
    try {
      await adminApi.transferOwnership(communityId, newOwnerId);
      toast.success("Ownership transferred.");
      announce("Ownership transferred.");
      setTransferTargets((prev) => ({ ...prev, [communityId]: "" }));
      await searchCommunities({ query: activeQuery || undefined });
    } catch (envelope) {
      const message = envelope?.message || "Could not transfer ownership.";
      toast.error(message);
      announce(message);
    }
  }

  async function handleUpdateUser(event) {
    event.preventDefault();
    setUserError("");
    setIsSavingUser(true);
    try {
      const { userId, ...payload } = userForm;
      await adminApi.updateUser(userId.trim(), payload);
      toast.success("User updated.");
      announce("User updated.");
    } catch (envelope) {
      const message = envelope?.message || "Could not update this user.";
      setUserError(message);
      announce(message);
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleDeleteUser() {
    const userId = userForm.userId.trim();
    if (!userId) return;
    setUserError("");
    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(userId);
      toast.success("User deleted.");
      announce("User deleted.");
      setUserForm(emptyUserForm);
    } catch (envelope) {
      const message = envelope?.message || "Could not delete this user.";
      setUserError(message);
      announce(message);
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleDismissReport(reportId) {
    try {
      await dismissReport(reportId);
      toast.success("Report dismissed.");
      announce("Report dismissed.");
    } catch (envelope) {
      const message = envelope?.message || "Could not dismiss this report.";
      toast.error(message);
      announce(message);
    }
  }

  async function handleRemoveContent(reportId) {
    try {
      await removeContent(reportId);
      toast.success("Content removed.");
      announce("Content removed.");
    } catch (envelope) {
      const message = envelope?.message || "Could not remove this content.";
      toast.error(message);
      announce(message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Communities</h2>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2" role="search">
          <label htmlFor="admin-community-search" className="sr-only">
            Search communities
          </label>
          <input
            id="admin-community-search"
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search communities"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2"
          />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium">
            Search
          </button>
        </form>

        {communityError && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {communityError}
          </p>
        )}

        {communityResults.items.length === 0 ? (
          <p role="status" className="text-muted-foreground">
            No results found.
          </p>
        ) : (
          <ul className="space-y-3">
            {communityResults.items.map((community) => (
              <li key={community.id} className="rounded-md border border-border p-4">
                {editingId === community.id ? (
                  <form onSubmit={(event) => handleUpdateCommunity(event, community.id)} className="space-y-2">
                    <input
                      aria-label="Community name"
                      value={communityForm.name}
                      onChange={(event) => setCommunityForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    />
                    <textarea
                      aria-label="Community description"
                      value={communityForm.description}
                      onChange={(event) =>
                        setCommunityForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    />
                    <select
                      aria-label="Community visibility"
                      value={communityForm.visibility}
                      onChange={(event) =>
                        setCommunityForm((prev) => ({ ...prev, visibility: event.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{community.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {community.visibility} · {community.memberCount} member(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(community)}
                          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCommunity(community.id)}
                          className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <form
                      onSubmit={(event) => handleTransferOwnership(event, community.id)}
                      className="mt-3 flex gap-2"
                    >
                      <label htmlFor={`transfer-${community.id}`} className="sr-only">
                        New owner user ID
                      </label>
                      <input
                        id={`transfer-${community.id}`}
                        type="text"
                        placeholder="New owner user ID"
                        value={transferTargets[community.id] || ""}
                        onChange={(event) =>
                          setTransferTargets((prev) => ({ ...prev, [community.id]: event.target.value }))
                        }
                        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                      >
                        Transfer ownership
                      </button>
                    </form>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pending reports</h2>

        {reports.items.length === 0 ? (
          <p role="status" className="text-muted-foreground">
            No pending reports.
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.items.map((report) => (
              <li key={report.id} className="rounded-md border border-border p-4">
                <p className="font-medium">
                  {report.targetType} · {report.targetId}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reported by {typeof report.reporter === "object" ? report.reporter.displayName : report.reporter} ·{" "}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{report.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDismissReport(report.id)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveContent(report.id)}
                    className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive"
                  >
                    Remove content
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {reports.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReportsPage((prev) => Math.max(1, prev - 1))}
              disabled={reports.page <= 1}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {reports.page} of {reports.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setReportsPage((prev) => Math.min(reports.totalPages, prev + 1))}
              disabled={reports.page >= reports.totalPages}
              className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
            >
              Next
            </button>
          </nav>
        )}
      </section>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <form onSubmit={handleUpdateUser} className="space-y-3">
          <div>
            <label htmlFor="admin-user-id" className="mb-1 block text-sm font-medium">
              User ID
            </label>
            <input
              id="admin-user-id"
              required
              value={userForm.userId}
              onChange={(event) => setUserForm((prev) => ({ ...prev, userId: event.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="admin-user-displayName" className="mb-1 block text-sm font-medium">
              Display name
            </label>
            <input
              id="admin-user-displayName"
              value={userForm.displayName}
              onChange={(event) => setUserForm((prev) => ({ ...prev, displayName: event.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="admin-user-bio" className="mb-1 block text-sm font-medium">
              Bio
            </label>
            <textarea
              id="admin-user-bio"
              value={userForm.bio}
              onChange={(event) => setUserForm((prev) => ({ ...prev, bio: event.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="admin-user-role" className="mb-1 block text-sm font-medium">
              Role
            </label>
            <select
              id="admin-user-role"
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {userError && (
            <p role="alert" className="text-sm text-destructive">
              {userError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSavingUser}
              className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
            >
              {isSavingUser ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={isDeletingUser}
              onClick={handleDeleteUser}
              className="rounded-md border border-destructive px-3 py-2 font-medium text-destructive disabled:opacity-60"
            >
              {isDeletingUser ? "Deleting…" : "Delete user"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
