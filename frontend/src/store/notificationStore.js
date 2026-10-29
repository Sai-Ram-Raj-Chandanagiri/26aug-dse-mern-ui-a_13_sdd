import { create } from "zustand";
import notificationsApi from "../api/notificationsApi";

const emptyPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };
const defaultPreference = { newDiscussion: true, newResource: true };

function countUnread(items) {
  return items.filter((item) => !item.readAt).length;
}

// Notifications domain Zustand store (US7) — inbox state with an unread count for the nav badge,
// plus per-category preferences (disabling all categories is permitted, FR-023)
const useNotificationStore = create((set) => ({
  notifications: emptyPage,
  unreadCount: 0,
  preference: defaultPreference,
  isLoading: false,

  async loadNotifications(params) {
    set({ isLoading: true });
    try {
      const { data } = await notificationsApi.list(params);
      const result = data ?? emptyPage;
      set({ notifications: result, unreadCount: countUnread(result.items), isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, notifications: emptyPage, unreadCount: 0 });
      throw err;
    }
  },

  async markRead(notificationId) {
    const { data } = await notificationsApi.markRead(notificationId);
    const readAt = data?.notification?.readAt ?? new Date().toISOString();
    set((state) => {
      const items = state.notifications.items.map((item) =>
        item.id === notificationId ? { ...item, readAt } : item
      );
      return { notifications: { ...state.notifications, items }, unreadCount: countUnread(items) };
    });
    return data?.notification ?? null;
  },

  async loadPreferences() {
    const { data } = await notificationsApi.getPreferences();
    const preference = data?.preference ?? defaultPreference;
    set({ preference });
    return preference;
  },

  async updatePreferences(payload) {
    const { data } = await notificationsApi.updatePreferences(payload);
    const preference = data?.preference ?? defaultPreference;
    set({ preference });
    return preference;
  },
}));

export default useNotificationStore;
