import { useEffect } from 'react'
import { connect, isConnected, subscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import useFriendStore from '../store/friendStore'

function isFriendRequestPayload(message) {
  return message?.type && message?.request
}

export default function useFriendRequestNotifications() {
  const { accessToken } = useAuthStore()
  const { upsertPendingRequest, addFriend, removePendingRequest } = useFriendStore()

  useEffect(() => {
    if (!accessToken) return undefined

    let active = true
    let removeListener = null

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        removeListener = subscribe('/user/queue/friend-requests', (message) => {
          if (!active || !isFriendRequestPayload(message)) return

          const request = message.request

          if (message.type === 'FRIEND_REQUEST_CREATED') {
            upsertPendingRequest(request)
            return
          }

          if (message.type === 'FRIEND_REQUEST_ACCEPTED') {
            removePendingRequest(request?.id)
            if (message.friend) {
              addFriend(message.friend)
            }
            return
          }

          if (message.type === 'FRIEND_REQUEST_DECLINED') {
            removePendingRequest(request?.id)
          }
        })
      } catch (error) {
        console.warn('Friend request subscription failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      removeListener?.()
    }
  }, [accessToken, addFriend, removePendingRequest, upsertPendingRequest])
}
