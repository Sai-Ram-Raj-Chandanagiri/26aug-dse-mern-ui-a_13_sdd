import { create } from "zustand";
import resourcesApi from "../api/resourcesApi";

const emptyPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// Resource domain Zustand store — community resource list + share form state (US5)
const useResourceStore = create((set) => ({
  resources: emptyPage,
  resource: null,
  isLoading: false,

  async loadResources(communityId, params) {
    set({ isLoading: true });
    try {
      const { data } = await resourcesApi.list(communityId, params);
      const result = data ?? emptyPage;
      set({ resources: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, resources: emptyPage });
      throw err;
    }
  },

  async createResource(communityId, payload) {
    const { data } = await resourcesApi.create(communityId, payload);
    const resource = data?.resource ?? null;
    if (resource) {
      set((state) => ({
        resources: {
          ...state.resources,
          items: [resource, ...state.resources.items],
          totalItems: state.resources.totalItems + 1,
        },
      }));
    }
    return resource;
  },

  async loadResource(resourceId) {
    set({ isLoading: true });
    try {
      const { data } = await resourcesApi.getById(resourceId);
      set({ resource: data?.resource ?? null, isLoading: false });
      return data?.resource ?? null;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  resetResource() {
    set({ resource: null });
  },
}));

export default useResourceStore;
