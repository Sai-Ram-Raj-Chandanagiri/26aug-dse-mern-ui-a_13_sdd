import axiosInstance from "./axiosInstance";

// Messaging domain API client (US12) — conversations/messages; responses are unwrapped to
// `{ success, data, message }` by the interceptor.
const messagingApi = {
  createConversation: (recipientUserId) =>
    axiosInstance.post("/conversations", { recipientUserId }),
  listConversations: (params) => axiosInstance.get("/conversations", { params }),
  listMessages: (conversationId, params) =>
    axiosInstance.get(`/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, body) =>
    axiosInstance.post(`/conversations/${conversationId}/messages`, { body }),
  markRead: (conversationId) => axiosInstance.patch(`/conversations/${conversationId}/read`),
};

export default messagingApi;
