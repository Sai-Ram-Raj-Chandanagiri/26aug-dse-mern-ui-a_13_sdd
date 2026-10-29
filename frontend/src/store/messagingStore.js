import { create } from "zustand";
import messagingApi from "../api/messagingApi.js";

const emptyConversationPage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };
const emptyMessagePage = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// Messaging domain Zustand store (US12) — inbox (conversation list) plus the active
// conversation's message history; unread-count badges come straight from the server per
// conversation (contracts/messaging.md) rather than being recomputed client-side.
const useMessagingStore = create((set) => ({
  conversations: emptyConversationPage,
  messages: emptyMessagePage,
  activeConversationId: null,
  isLoading: false,

  async loadConversations(params) {
    set({ isLoading: true });
    try {
      const { data } = await messagingApi.listConversations(params);
      const result = data ?? emptyConversationPage;
      set({ conversations: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, conversations: emptyConversationPage });
      throw err;
    }
  },

  async startConversation(recipientUserId) {
    const { data } = await messagingApi.createConversation(recipientUserId);
    const conversation = data?.conversation ?? null;
    if (conversation) {
      set((state) => {
        const withoutExisting = state.conversations.items.filter((item) => item.id !== conversation.id);
        return {
          conversations: {
            ...state.conversations,
            items: [conversation, ...withoutExisting],
            totalItems: withoutExisting.length === state.conversations.items.length
              ? state.conversations.totalItems + 1
              : state.conversations.totalItems,
          },
        };
      });
    }
    return conversation;
  },

  async loadMessages(conversationId, params) {
    set({ isLoading: true, activeConversationId: conversationId });
    try {
      const { data } = await messagingApi.listMessages(conversationId, params);
      const result = data ?? emptyMessagePage;
      set({ messages: result, isLoading: false });
      return result;
    } catch (err) {
      set({ isLoading: false, messages: emptyMessagePage });
      throw err;
    }
  },

  async sendMessage(conversationId, body) {
    const { data } = await messagingApi.sendMessage(conversationId, body);
    const message = data?.message ?? null;
    if (message) {
      set((state) => ({
        messages: { ...state.messages, items: [...state.messages.items, message] },
      }));
    }
    return message;
  },

  async markRead(conversationId) {
    await messagingApi.markRead(conversationId);
    set((state) => ({
      conversations: {
        ...state.conversations,
        items: state.conversations.items.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item
        ),
      },
    }));
  },

  reset() {
    set({ messages: emptyMessagePage, activeConversationId: null });
  },
}));

export default useMessagingStore;
