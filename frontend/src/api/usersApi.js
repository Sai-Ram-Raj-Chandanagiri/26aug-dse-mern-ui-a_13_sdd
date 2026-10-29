import axiosInstance from "./axiosInstance";

// Users domain API client — all requests go through the single configured Axios instance
// (Constitution Principle V); responses are already unwrapped to `{ ...data }` by the
// axiosInstance interceptor.
const usersApi = {
  getMe: () => axiosInstance.get("/users/me"),
  updateMe: (payload) => axiosInstance.patch("/users/me", payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosInstance.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getActivity: () => axiosInstance.get("/users/me/activity"),
};

export default usersApi;
