import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useMessagingStore from "../store/messagingStore.js";
import useAuthStore from "../store/authStore.js";
import EmptyState from "../components/common/EmptyState.jsx";

// Chat/conversation detail view (US12) — sent/received distinction, compose box with an
// empty-message guard (FR-031), and a mark-read call on open so the Inbox badge clears.
export default function ConversationDetail() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const messages = useMessagingStore((state) => state.messages);
  const loadMessages = useMessagingStore((state) => state.loadMessages);
  const sendMessage = useMessagingStore((state) => state.sendMessage);
  const markRead = useMessagingStore((state) => state.markRead);
  const reset = useMessagingStore((state) => state.reset);

  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages(id).catch(() => {});
    markRead(id).catch(() => {});
    return () => reset();
  }, [id, loadMessages, markRead, reset]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.items.length]);

  async function handleSend(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      await sendMessage(id, trimmed);
      setBody("");
    } catch {
      // Error is already surfaced via the global toast interceptor
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Link to="/inbox" className="mb-4 text-sm text-muted-foreground underline">
        &larr; Back to inbox
      </Link>

      {messages.items.length === 0 ? (
        <EmptyState message="No messages yet. Say hello!" />
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.items.map((message) => {
            const isMine = message.sender === currentUser?.id;
            return (
              <li
                key={message.id}
                className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${
                  isMine
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground"
                }`}
              >
                <p>{message.body}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </li>
            );
          })}
          <li ref={bottomRef} />
        </ul>
      )}

      <form onSubmit={handleSend} className="mt-4 flex items-end gap-2">
        <label htmlFor="messageBody" className="sr-only">
          Message
        </label>
        <textarea
          id="messageBody"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSending || !body.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
