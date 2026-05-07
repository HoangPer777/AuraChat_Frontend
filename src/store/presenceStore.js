import { create } from 'zustand'

/**
 * Presence Store - Manages user presence/online status
 * 
 * State:
 * - presenceMap: Map of userId -> presence data { status: 'online'|'offline', lastSeen: ISO8601 }
 * 
 * Persistence:
 * - Not persisted to localStorage
 * - Fetched from backend on WebSocket connection
 * - Updated in real-time via WebSocket presence events
 */
const usePresenceStore = create((set) => ({
  // State
  // Map<userId, { status: 'online'|'offline', lastSeen: ISO8601, device?: string }>
  presenceMap: {},

  // Actions
  /**
   * Update presence data for a specific user
   * Merges with existing presence data
   */
  updatePresence: (userId, data) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: data },
    })),

  /**
   * Set complete presence map
   * Replaces entire presence state
   */
  setPresenceMap: (presenceMap) => set({ presenceMap }),

  /**
   * Clear all presence data
   * Called on logout or connection loss
   */
  clearPresence: () => set({ presenceMap: {} }),
}))

export default usePresenceStore
