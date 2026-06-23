import useChatStore from '../store/chatStore'
import usePresenceStore from '../store/presenceStore'

export function applyPresenceUpdate(presence) {
  if (!presence?.userId) return

  const isOnline = presence.status === 'online'
  useChatStore.getState().setFriendOnlineStatus(presence.userId, isOnline)
  usePresenceStore.getState().updatePresence(presence.userId, {
    status: presence.status,
    lastSeen: presence.lastSeen ?? null,
  })
}

export function applyPresenceBatch(statuses) {
  if (!Array.isArray(statuses)) return

  statuses.forEach((presence) => {
    if (presence?.userId) {
      applyPresenceUpdate(presence)
    }
  })
}
