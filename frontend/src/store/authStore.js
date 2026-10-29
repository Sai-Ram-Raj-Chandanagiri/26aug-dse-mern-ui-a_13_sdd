import { create } from "zustand";
import authApi from "../api/authApi";

// Auth domain Zustand store — single source of truth for session state (Constitution Principle V)
const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  async hydrate() {
    try {
      const { data } = await authApi.session();
      set({ user: data?.user ?? null, isAuthenticated: Boolean(data?.user), isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser(user) {
    set({ user, isAuthenticated: Boolean(user) });
  },

  clearUser() {
    set({ user: null, isAuthenticated: false });
  },

  // register/verifyEmail/requestPasswordReset/resetPassword don't set session state themselves
  // (register requires email verification first; the others don't start a session) — they just
  // forward to authApi so pages can await + handle their own success/error feedback.
  async register(payload) {
    const { data } = await authApi.register(payload);
    return data;
  },

  async verifyEmail(payload) {
    const { data } = await authApi.verifyEmail(payload);
    return data;
  },

  async login(payload) {
    const { data } = await authApi.login(payload);
    set({ user: data?.user ?? null, isAuthenticated: Boolean(data?.user) });
    return data;
  },

  async logout() {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  async requestPasswordReset(payload) {
    const { data } = await authApi.requestPasswordReset(payload);
    return data;
  },

  async resetPassword(payload) {
    const { data } = await authApi.resetPassword(payload);
    return data;
  },
}));

export default useAuthStore;
