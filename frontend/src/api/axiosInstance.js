import axios from "axios";
import toast from "react-hot-toast";

// Single configured Axios instance — all server communication goes through this (Constitution Principle V)
const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response) => response.data, // unwraps { success, data, message } envelope
  (error) => {
    const envelope = error.response?.data;
    const message = envelope?.message || "Something went wrong. Please try again.";
    // Callers that expect a failure as part of normal flow (e.g. session hydration on load for a
    // logged-out visitor) can pass `{ skipErrorToast: true }` in the request config to suppress it.
    if (!error.config?.skipErrorToast) {
      toast.error(message);
    }
    return Promise.reject(envelope || error);
  }
);

export default axiosInstance;
