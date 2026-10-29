import { create } from "zustand";
import usersApi from "../api/usersApi";

// Profile domain Zustand store — editable profile fields + activity summary (US2)
const useProfileStore = create((set) => ({
  profile: null,
  activity: null,
  isLoading: false,

  async loadProfile() {
    set({ isLoading: true });
    try {
      const { data } = await usersApi.getMe();
      set({ profile: data?.user ?? null, isLoading: false });
      return data?.user ?? null;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // FR-007: email/role are stripped server-side regardless of what's sent
  async updateProfile(payload) {
    const { data } = await usersApi.updateMe(payload);
    set({ profile: data?.user ?? null });
    return data?.user ?? null;
  },

  // FR-008: server rejects uploads over 5 MB / non-image files
  async uploadAvatar(file) {
    const { data } = await usersApi.uploadAvatar(file);
    set({ profile: data?.user ?? null });
    return data?.user ?? null;
  },

  // FR-009: summary of the user's own activity
  async loadActivity() {
    const { data } = await usersApi.getActivity();
    set({ activity: data?.activity ?? null });
    return data?.activity ?? null;
  },
}));

export default useProfileStore;
