import axiosInstance from "./axiosInstance";

// Admin domain API client (US6) — every request here hits a `requireAdmin`-gated route; server-side
// enforcement is the source of truth (Constitution Principle I), this client never assumes access.
const adminApi = {
  updateCommunity: (communityId, payload) => axiosInstance.patch(`/admin/communities/${communityId}`, payload),
  deleteCommunity: (communityId, { force = false } = {}) =>
    axiosInstance.delete(`/admin/communities/${communityId}`, { params: force ? { force: true } : undefined }),
  transferOwnership: (communityId, newOwnerId) =>
    axiosInstance.post(`/admin/communities/${communityId}/transfer-ownership`, { newOwnerId }),
  updateUser: (userId, payload) => axiosInstance.patch(`/admin/users/${userId}`, payload),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
};

export default adminApi;
