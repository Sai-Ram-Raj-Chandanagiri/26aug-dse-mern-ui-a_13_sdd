import axiosInstance from "./axiosInstance";

// Notifications domain API client (US7) — inbox listing/mark-read plus per-category preferences;
// responses are unwrapped to `{ success, data, message }` by the interceptor.
const notificationsApi = {
  list: (params) => axiosInstance.get("/notifications", { params }),
  markRead: (notificationId) => axiosInstance.patch(`/notifications/${notificationId}/read`),
  getPreferences: () => axiosInstance.get("/notifications/preferences"),
  updatePreferences: (payload) => axiosInstance.patch("/notifications/preferences", payload),
};

export default notificationsApi;
