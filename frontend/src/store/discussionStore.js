import { create } from "zustand";
import discussionsApi from "../api/discussionsApi";

const emptyPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// Discussion domain Zustand store — community browse/join + discussion thread state (US4)
const useDiscussionStore = create((set) => ({
  communityResults: emptyPage,
  discussions: emptyPage,
  discussion: null,
  comments: emptyPage,
  isMember: false,
  isLoading: false,

  async searchCommunities(params) {
    set({ isLoading: true });
    try {
      const { data } = await discussionsApi.searchCommunities(params);
      const result = data ?? emptyPage;
      set({ communityResults: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async joinCommunity(communityId) {
    const { data } = await discussionsApi.joinCommunity(communityId);
    set((state) => ({
      isMember: true,
      communityResults: {
        ...state.communityResults,
        items: state.communityResults.items.map((item) =>
          item.id === communityId ? { ...item, isMember: true, memberCount: item.memberCount + 1 } : item
        ),
      },
    }));
    return data?.membership ?? null;
  },

  async loadDiscussions(communityId, params) {
    set({ isLoading: true });
    try {
      const { data } = await discussionsApi.list(communityId, params);
      const result = data ?? emptyPage;
      set({ discussions: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, discussions: emptyPage });
      throw err;
    }
  },

  async createDiscussion(communityId, payload) {
    const { data } = await discussionsApi.create(communityId, payload);
    const discussion = data?.discussion ?? null;
    if (discussion) {
      set((state) => ({
        discussions: {
          ...state.discussions,
          items: [discussion, ...state.discussions.items],
          totalItems: state.discussions.totalItems + 1,
        },
      }));
    }
    return discussion;
  },

  async loadDiscussion(discussionId, params) {
    set({ isLoading: true });
    try {
      const { data } = await discussionsApi.getById(discussionId, params);
      set({
        discussion: data?.discussion ?? null,
        comments: data?.comments ?? emptyPage,
        isMember: Boolean(data?.isMember),
        isLoading: false,
      });
      return data ?? null;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async addComment(discussionId, body) {
    const { data } = await discussionsApi.addComment(discussionId, body);
    const comment = data?.comment ?? null;
    if (comment) {
      set((state) => ({
        comments: {
          ...state.comments,
          items: [...state.comments.items, comment],
          totalItems: state.comments.totalItems + 1,
        },
      }));
    }
    return comment;
  },

  resetThread() {
    set({ discussion: null, comments: emptyPage, isMember: false });
  },
}));

export default useDiscussionStore;
