import axiosInstance from "./axiosInstance";

// Resources domain API client (US5) — link/article/video variants post JSON; the file variant
// posts multipart/form-data. Responses are unwrapped to `{ success, data, message }` by the
// interceptor.
const resourcesApi = {
  list: (communityId, params) => axiosInstance.get(`/communities/${communityId}/resources`, { params }),
  create: (communityId, { type, title, url, file }) => {
    if (type === "file") {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title);
      formData.append("file", file);
      return axiosInstance.post(`/communities/${communityId}/resources`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosInstance.post(`/communities/${communityId}/resources`, { type, title, url });
  },
  getById: (resourceId) => axiosInstance.get(`/resources/${resourceId}`),
};

export default resourcesApi;
