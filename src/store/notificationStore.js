import { create } from 'zustand'

const STORAGE_KEY = 'aurachat_notifications'
const MAX_ITEMS = 100

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistNotifications(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
}

const useNotificationStore = create((set, get) => ({
  items: loadStoredNotifications(),
  browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  pushEnabled: localStorage.getItem('aurachat_push_enabled') === 'true',

  setBrowserPermission: (permission) => set({ browserPermission: permission }),

  setPushEnabled: (enabled) => {
    localStorage.setItem('aurachat_push_enabled', enabled ? 'true' : 'false')
    set({ pushEnabled: enabled })
  },

  addNotification: (notification) =>
    set((state) => {
      const id = notification.id || `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const createdAt = notification.createdAt || new Date().toISOString()

      const existingIndex = state.items.findIndex((item) => item.id === id)
      const nextItem = {
        read: false,
        ...notification,
        id,
        createdAt,
      }

      let items
      if (existingIndex >= 0) {
        items = [...state.items]
        items[existingIndex] = { ...items[existingIndex], ...nextItem }
      } else {
        items = [nextItem, ...state.items]
      }

      persistNotifications(items)
      return { items }
    }),

  markAsRead: (id) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      )
      persistNotifications(items)
      return { items }
    }),

  markAllAsRead: () =>
    set((state) => {
      const items = state.items.map((item) => ({ ...item, read: true }))
      persistNotifications(items)
      return { items }
    }),

  markConversationAsRead: (conversationId) =>
    set((state) => {
      if (!conversationId) return state
      const items = state.items.map((item) =>
        item.type === 'MESSAGE' && item.conversationId === conversationId
          ? { ...item, read: true }
          : item,
      )
      persistNotifications(items)
      return { items }
    }),

  removeNotification: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      persistNotifications(items)
      return { items }
    }),

  clearAll: () => {
    persistNotifications([])
    set({ items: [] })
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}))

export default useNotificationStore
