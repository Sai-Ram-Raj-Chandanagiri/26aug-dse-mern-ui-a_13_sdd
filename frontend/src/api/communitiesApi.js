import axiosInstance from "./axiosInstance";

// Communities domain API client — all requests go through the single configured Axios instance
// (Constitution Principle V); responses are already unwrapped to `{ ...data }` by the
// axiosInstance interceptor.
const communitiesApi = {
  create: (payload) => axiosInstance.post("/communities", payload),
  update: (id, payload) => axiosInstance.patch(`/communities/${id}`, payload),
  getById: (id) => axiosInstance.get(`/communities/${id}`),
  invite: (id, invitedUserEmail) => axiosInstance.post(`/communities/${id}/invitations`, { invitedUserEmail }),
  listMyInvitations: () => axiosInstance.get("/communities/invitations/mine"),
  acceptInvitation: (invitationId) => axiosInstance.post(`/communities/invitations/${invitationId}/accept`),
  declineInvitation: (invitationId) => axiosInstance.post(`/communities/invitations/${invitationId}/decline`),
};

export default communitiesApi;
