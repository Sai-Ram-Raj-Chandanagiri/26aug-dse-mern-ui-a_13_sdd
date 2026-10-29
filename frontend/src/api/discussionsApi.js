import axiosInstance from "./axiosInstance";

// Discussions domain API client (US4) — includes the community browse/join calls that drive the
// discussion flow; responses are unwrapped to `{ success, data, message }` by the interceptor.
const discussionsApi = {
  searchCommunities: (params) => axiosInstance.get("/communities", { params }),
  joinCommunity: (communityId) => axiosInstance.post(`/communities/${communityId}/join`),
  list: (communityId, params) => axiosInstance.get(`/communities/${communityId}/discussions`, { params }),
  create: (communityId, payload) => axiosInstance.post(`/communities/${communityId}/discussions`, payload),
  getById: (discussionId, params) => axiosInstance.get(`/discussions/${discussionId}`, { params }),
  addComment: (discussionId, body) => axiosInstance.post(`/discussions/${discussionId}/comments`, { body }),
};

export default discussionsApi;
