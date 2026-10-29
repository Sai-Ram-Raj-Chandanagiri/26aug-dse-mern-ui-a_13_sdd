import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useMessagingStore from "../store/messagingStore.js";
import EmptyState from "../components/common/EmptyState.jsx";

// Inbox page (US12) — conversation list ordered by `lastMessageAt desc` with unread badges;
// also doubles as the entry point for starting a new conversation (POST /api/conversations),
// since there is no separate user-directory UI in scope yet.
export default function Inbox() {
  const conversations = useMessagingStore((state) => state.conversations);
  const loadConversations = useMessagingStore((state) => state.loadConversations);
  const startConversation = useMessagingStore((state) => state.startConversation);

  const [page, setPage] = useState(1);
  const [recipientUserId, setRecipientUserId] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadConversations({ page }).catch(() => {});
  }, [loadConversations, page]);

  async function handleStartConversation(event) {
    event.preventDefault();
    if (!recipientUserId.trim()) return;
    setIsStarting(true);
    try {
      await startConversation(recipientUserId.trim());
      setRecipientUserId("");
    } catch {
      // Error is already surfaced via the global toast interceptor
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Inbox</h1>

      <form onSubmit={handleStartConversation} className="mb-6 flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="recipientUserId" className="block text-sm font-medium">
            Start a new conversation
          </label>
          <input
            id="recipientUserId"
            type="text"
            value={recipientUserId}
            onChange={(e) => setRecipientUserId(e.target.value)}
            placeholder="Recipient user ID"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isStarting || !recipientUserId.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Start
        </button>
      </form>

      {conversations.items.length === 0 ? (
        <EmptyState message="You don't have any conversations yet." />
      ) : (
        <ul className="space-y-3">
          {conversations.items.map((conversation) => (
            <li key={conversation.id}>
              <Link
                to={`/inbox/${conversation.id}`}
                className="flex items-center justify-between rounded-md border border-border p-4 hover:bg-muted"
              >
                <div>
                  <p className="font-medium">
                    {conversation.otherParticipant?.displayName || "Unknown user"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {conversation.lastMessageAt
                      ? new Date(conversation.lastMessageAt).toLocaleString()
                      : "No messages yet"}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span
                    className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                    aria-label={`${conversation.unreadCount} unread messages`}
                  >
                    {conversation.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {conversations.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={conversations.page <= 1}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {conversations.page} of {conversations.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(conversations.totalPages, prev + 1))}
            disabled={conversations.page >= conversations.totalPages}
            className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
