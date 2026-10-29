import axiosInstance from "./axiosInstance";

// Auth domain API client — all requests go through the single configured Axios instance
// (Constitution Principle V); responses are already unwrapped to `{ ...data }` by the
// axiosInstance interceptor.
const authApi = {
  register: (payload) => axiosInstance.post("/auth/register", payload),
  verifyEmail: (payload) => axiosInstance.post("/auth/verify-email", payload),
  login: (payload) => axiosInstance.post("/auth/login", payload),
  logout: () => axiosInstance.post("/auth/logout"),
  requestPasswordReset: (payload) => axiosInstance.post("/auth/request-password-reset", payload),
  resetPassword: (payload) => axiosInstance.post("/auth/reset-password", payload),
  session: () => axiosInstance.get("/auth/session", { skipErrorToast: true }),
};

export default authApi;
