import { useEffect, useState } from "react";
import useNotificationStore from "../../store/notificationStore.js";
import { announce } from "../../lib/announce.js";

const TYPE_LABELS = {
  new_discussion: "New discussion posted in a community you belong to.",
  new_resource: "New resource shared in a community you belong to.",
};

// Notifications inbox panel (US7) — lists this user's fan-out notifications newest first with an
// unread indicator (FR-022); each unread item can be marked read individually.
export default function NotificationsPanel({ onClose }) {
  const notifications = useNotificationStore((state) => state.notifications);
  const loadNotifications = useNotificationStore((state) => state.loadNotifications);
  const markRead = useNotificationStore((state) => state.markRead);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications({ page: 1 })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkRead(notificationId) {
    try {
      await markRead(notificationId);
      announce("Notification marked as read.");
    } catch (envelope) {
      announce(envelope?.message || "Could not update notification.");
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-20 mt-2 w-80 rounded-md border border-border bg-background p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notifications</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Close
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notifications.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {notifications.items.map((item) => (
            <li
              key={item.id}
              className={`rounded-md border border-border p-2 text-sm ${item.readAt ? "" : "bg-muted"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span>{TYPE_LABELS[item.type] || "New community activity."}</span>
                {!item.readAt && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
