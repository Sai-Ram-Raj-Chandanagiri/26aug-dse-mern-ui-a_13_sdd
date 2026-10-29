import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore.js";
import useNotificationStore from "../../store/notificationStore.js";
import NotificationsPanel from "../notifications/NotificationsPanel.jsx";
import { announce } from "../../lib/announce.js";

// Shared app shell: auth-aware primary nav, toast provider, and an aria-live region for form
// feedback (Constitution Principle II — error/success states must be announced, not color-only)
export default function AppShell({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loadNotifications = useNotificationStore((state) => state.loadNotifications);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Hydrate the unread badge as soon as a session exists, independent of whether the panel is open
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications({ page: 1 }).catch(() => {});
    }
  }, [isAuthenticated, loadNotifications]);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out.");
      announce("Logged out.");
      navigate("/login");
    } catch (envelope) {
      announce(envelope?.message || "Could not log out.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <nav aria-label="Primary" className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="font-semibold">
          Roundtable
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <Link to="/communities" className="underline-offset-4 hover:underline">
                Communities
              </Link>
              <Link to="/communities/new" className="underline-offset-4 hover:underline">
                Create community
              </Link>
              <Link to="/invitations" className="underline-offset-4 hover:underline">
                Invitations
              </Link>
              <Link to="/profile" className="underline-offset-4 hover:underline">
                Profile
              </Link>
              <Link to="/saved-items" className="underline-offset-4 hover:underline">
                Saved items
              </Link>
              <Link to="/inbox" className="underline-offset-4 hover:underline">
                Inbox
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((open) => !open)}
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="dialog"
                  className="underline-offset-4 hover:underline"
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </button>
                {isNotificationsOpen && (
                  <NotificationsPanel onClose={() => setIsNotificationsOpen(false)} />
                )}
              </div>
              <Link to="/notifications/settings" className="underline-offset-4 hover:underline">
                Notification settings
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="underline-offset-4 hover:underline">
                  Admin
                </Link>
              )}
              <span className="text-muted-foreground">{user?.displayName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-border px-3 py-1.5 font-medium"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="underline-offset-4 hover:underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      <main id="main-content" className="p-4">
        {children}
      </main>
      <div aria-live="polite" className="sr-only" id="app-live-region" />
      <Toaster position="top-right" />
    </div>
  );
}
