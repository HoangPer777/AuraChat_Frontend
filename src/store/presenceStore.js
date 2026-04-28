import { create } from 'zustand'

const usePresenceStore = create((set) => ({
  // Map<userId, { status: 'online'|'offline', lastSeen: string }>
  presenceMap: {},
  updatePresence: (userId, data) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: data },
    })),
}))

export default usePresenceStore
