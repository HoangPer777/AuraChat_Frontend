import { create } from 'zustand'
import { sortMessagesAscending } from '../utils/chatMessages'

/**
 * Chat Store - Manages chat state including conversations and messages
 * 
 * State:
 * - conversations: Array of conversation objects
 * - activeConversation: Currently selected conversation or null
 * - messages: Array of messages in active conversation
 * - isLoading: Loading state for chat operations
 * - error: Error message from chat operations
 * 
 * Persistence:
 * - Not persisted to localStorage
 * - Fetched from backend API on each session
 * - Updated in real-time via WebSocket events
 */
const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  /** userId -> true when online */
  onlineByUserId: {},

  // Actions
  /**
   * Set list of conversations
   */
  setConversations: (conversations) => set({ conversations, error: null }),

  /**
   * Set active conversation. Clears messages unless keepMessages is true.
   */
  setActiveConversation: (conversation, keepMessages = false) =>
    set((state) => ({
      activeConversation: conversation,
      messages: keepMessages ? state.messages : [],
    })),

  /**
   * Patch fields on active conversation without clearing messages.
   */
  patchActiveConversation: (updates) =>
    set((state) => ({
      activeConversation: state.activeConversation
        ? { ...state.activeConversation, ...updates }
        : null,
    })),

  /**
   * Add a new message to the messages array (keeps chronological order).
   */
  addMessage: (message) =>
    set((state) => ({
      messages: sortMessagesAscending([...state.messages, message]),
    })),

  /**
   * Set complete messages array for active conversation
   */
  setMessages: (messages) => set({ messages: sortMessagesAscending(messages), error: null }),

  /**
   * Update an existing message (e.g., status change, edit)
   */
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  /**
   * Update lastMessage of a conversation in the list (called on real-time message receipt).
   */
  updateConversationLastMessage: (conversationId, lastMessage) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, lastMessage, updatedAt: lastMessage.sentAt }
          : conv
      ),
    })),

  /**
   * Update online status of a friend (called on presence WebSocket event).
   */
  setFriendOnlineStatus: (userId, isOnline) =>
    set((state) => {
      if (!userId) return state

      if (isOnline) {
        if (state.onlineByUserId[userId]) return state
        return {
          onlineByUserId: { ...state.onlineByUserId, [userId]: true },
        }
      }

      if (!state.onlineByUserId[userId]) return state
      const next = { ...state.onlineByUserId }
      delete next[userId]
      return { onlineByUserId: next }
    }),

  /**
   * Check if a user is online.
   */
  isOnline: (userId) => Boolean(get().onlineByUserId[userId]),

  /**
   * Set loading state for chat operations
   */
  setLoading: (isLoading) => {
    set({ isLoading })
  },

  /**
   * Set error message from chat operation
   */
  setError: (error) => {
    set({ error })
  },
}))

export default useChatStore
