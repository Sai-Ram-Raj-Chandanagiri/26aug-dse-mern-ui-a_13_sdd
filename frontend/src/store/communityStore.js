import { create } from "zustand";
import communitiesApi from "../api/communitiesApi";

// Community domain Zustand store — create/edit community + invitation lifecycle (US3)
const useCommunityStore = create((set) => ({
  community: null,
  invitations: [],
  isLoading: false,

  async createCommunity(payload) {
    const { data } = await communitiesApi.create(payload);
    set({ community: data?.community ?? null });
    return data?.community ?? null;
  },

  async loadCommunity(id) {
    set({ isLoading: true });
    try {
      const { data } = await communitiesApi.getById(id);
      set({ community: data?.community ?? null, isLoading: false });
      return data?.community ?? null;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async updateCommunity(id, payload) {
    const { data } = await communitiesApi.update(id, payload);
    set({ community: data?.community ?? null });
    return data?.community ?? null;
  },

  async invite(id, invitedUserEmail) {
    const { data } = await communitiesApi.invite(id, invitedUserEmail);
    return data?.invitation ?? null;
  },

  async loadMyInvitations() {
    const { data } = await communitiesApi.listMyInvitations();
    set({ invitations: data?.invitations ?? [] });
    return data?.invitations ?? [];
  },

  async acceptInvitation(invitationId) {
    const { data } = await communitiesApi.acceptInvitation(invitationId);
    set((state) => ({ invitations: state.invitations.filter((inv) => inv.id !== invitationId) }));
    return data?.membership ?? null;
  },

  async declineInvitation(invitationId) {
    await communitiesApi.declineInvitation(invitationId);
    set((state) => ({ invitations: state.invitations.filter((inv) => inv.id !== invitationId) }));
  },
}));

export default useCommunityStore;
