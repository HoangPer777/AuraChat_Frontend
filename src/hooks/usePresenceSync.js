import { useEffect } from 'react'
import { connect, isConnected, send, subscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import useFriendStore from '../store/friendStore'
import { getFriendsPresence } from '../services/presenceService'
import { applyPresenceBatch, applyPresenceUpdate } from '../utils/applyPresence'

const HEARTBEAT_INTERVAL_MS = 20_000

async function syncKnownFriendsPresence() {
  const friendIds = useFriendStore.getState().friends.map((friend) => friend.id)
  if (friendIds.length === 0) return

  const statuses = await getFriendsPresence(friendIds)
  applyPresenceBatch(statuses)
}

/**
 * Giữ presence online (heartbeat) và đồng bộ trạng thái bạn bè qua WS + REST.
 */
export default function usePresenceSync() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.id)
  const friends = useFriendStore((s) => s.friends)

  useEffect(() => {
    if (!accessToken || !userId) return undefined

    let active = true
    let heartbeatTimer = null
    let removePresenceListener = null

    const sendHeartbeat = () => {
      if (isConnected()) {
        send('/app/presence/heartbeat', {})
      }
    }

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        sendHeartbeat()
        heartbeatTimer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

        await syncKnownFriendsPresence()

        removePresenceListener = subscribe('/user/queue/presence', (presence) => {
          if (!active || !presence?.userId) return
          applyPresenceUpdate(presence)
        })
      } catch (error) {
        console.warn('Presence sync failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer)
      }
      removePresenceListener?.()
    }
  }, [accessToken, userId])

  useEffect(() => {
    if (!accessToken || friends.length === 0) return undefined

    let cancelled = false

    getFriendsPresence(friends.map((friend) => friend.id))
      .then((statuses) => {
        if (!cancelled) {
          applyPresenceBatch(statuses)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [accessToken, friends])
}
