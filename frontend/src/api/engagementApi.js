import axiosInstance from "./axiosInstance";

// Engagement domain API client (US9, US10) — likes/bookmarks carry their polymorphic target in
// the body on create (contracts/engagement.md); responses are unwrapped to `{ success, data, message }`.
const engagementApi = {
  like: ({ targetType, targetId }) => axiosInstance.post("/likes", { targetType, targetId }),
  unlike: ({ targetType, targetId }) => axiosInstance.delete("/likes", { data: { targetType, targetId } }),
  bookmark: ({ targetType, targetId }) => axiosInstance.post("/bookmarks", { targetType, targetId }),
  unbookmark: (bookmarkId) => axiosInstance.delete(`/bookmarks/${bookmarkId}`),
  // Listing lives under /users/me/bookmarks (contracts/users.md) rather than /bookmarks itself
  listBookmarks: (params) => axiosInstance.get("/users/me/bookmarks", { params }),
};

export default engagementApi;
