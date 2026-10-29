import { create } from "zustand";
import engagementApi from "../api/engagementApi.js";

const emptyPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// Saved-items domain Zustand store (US10) — GET /api/users/me/bookmarks listing, paginated and
// optionally filtered by targetType; FR-027 exclusion of removed targets happens server-side.
const useSavedItemsStore = create((set) => ({
  bookmarks: emptyPage,
  isLoading: false,

  async loadBookmarks(params) {
    set({ isLoading: true });
    try {
      const { data } = await engagementApi.listBookmarks(params);
      const result = data ?? emptyPage;
      set({ bookmarks: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, bookmarks: emptyPage });
      throw err;
    }
  },

  // Optimistic drop so a removal in `BookmarkButton` doesn't need a full reload
  removeBookmark(bookmarkId) {
    set((state) => ({
      bookmarks: {
        ...state.bookmarks,
        items: state.bookmarks.items.filter((item) => item.id !== bookmarkId),
        totalItems: Math.max(0, state.bookmarks.totalItems - 1),
      },
    }));
  },
}));

export default useSavedItemsStore;
