import { create } from "zustand";
import moderationApi from "../api/moderationApi";

const emptyPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// Moderation domain Zustand store — admin reports dashboard state plus the member report action (US11)
const useModerationStore = create((set) => ({
  reports: emptyPage,
  isLoading: false,

  async createReport(payload) {
    const { data } = await moderationApi.createReport(payload);
    return data?.report ?? null;
  },

  async loadAdminReports(params) {
    set({ isLoading: true });
    try {
      const { data } = await moderationApi.listAdminReports(params);
      const result = data ?? emptyPage;
      set({ reports: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, reports: emptyPage });
      throw err;
    }
  },

  async dismissReport(reportId) {
    const { data } = await moderationApi.dismissReport(reportId);
    set((state) => ({
      reports: {
        ...state.reports,
        items: state.reports.items.filter((report) => report.id !== reportId),
        totalItems: Math.max(0, state.reports.totalItems - 1),
      },
    }));
    return data?.report ?? null;
  },

  async removeContent(reportId) {
    const { data } = await moderationApi.removeContent(reportId);
    set((state) => ({
      reports: {
        ...state.reports,
        items: state.reports.items.filter((report) => report.id !== reportId),
        totalItems: Math.max(0, state.reports.totalItems - 1),
      },
    }));
    return data?.report ?? null;
  },
}));

export default useModerationStore;
