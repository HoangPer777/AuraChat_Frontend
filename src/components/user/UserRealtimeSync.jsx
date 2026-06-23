import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import useIncomingCallNotifications from '../../hooks/useIncomingCallNotifications'
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications'
import useChatWebSocket from '../../hooks/useChatWebSocket'
import useFriendStore from '../../store/friendStore'

/**
 * Giữ WebSocket subscriptions sống trên mọi trang user (kể cả /call/*).
 */
export default function UserRealtimeSync() {
  const loadPendingRequests = useFriendStore((s) => s.loadPendingRequests)

  useIncomingCallNotifications()
  useFriendRequestNotifications()
  useChatWebSocket()

  useEffect(() => {
    loadPendingRequests().catch(() => {})
  }, [loadPendingRequests])

  return <Outlet />
}
