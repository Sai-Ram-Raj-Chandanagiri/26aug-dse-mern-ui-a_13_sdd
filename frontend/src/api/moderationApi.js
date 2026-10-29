import axiosInstance from "./axiosInstance";

// Moderation domain API client (US11) — member-facing report submission plus the admin reports
// dashboard; responses are unwrapped to `{ success, data, message }` by the interceptor.
const moderationApi = {
  createReport: ({ targetType, targetId, reason }) =>
    axiosInstance.post("/reports", { targetType, targetId, reason }),
  listAdminReports: (params) => axiosInstance.get("/admin/reports", { params }),
  dismissReport: (reportId) => axiosInstance.patch(`/admin/reports/${reportId}/dismiss`),
  removeContent: (reportId) => axiosInstance.patch(`/admin/reports/${reportId}/remove-content`),
};

export default moderationApi;
