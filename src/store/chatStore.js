import { create } from 'zustand'

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
  /** Set of userIds currently online */
  onlineUsers: new Set(),

  // Actions
  /**
   * Set list of conversations
   */
  setConversations: (conversations) => set({ conversations, error: null }),

  /**
   * Set active conversation and clear messages
   * Messages will be fetched separately
   */
  setActiveConversation: (conversation) => set({ activeConversation: conversation, messages: [] }),

  /**
   * Add a new message to the messages array
   * Used for real-time message reception via WebSocket
   */
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  /**
   * Set complete messages array for active conversation
   * Used when fetching message history
   */
  setMessages: (messages) => set({ messages, error: null }),

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
    set((state) => ({
      onlineUsers: isOnline
        ? new Set([...state.onlineUsers, userId])
        : new Set([...state.onlineUsers].filter((id) => id !== userId)),
    })),

  /**
   * Check if a user is online.
   */
  isOnline: (userId) => get().onlineUsers.has(userId),

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
