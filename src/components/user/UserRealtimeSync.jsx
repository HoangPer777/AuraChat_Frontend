import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import useIncomingCallNotifications from '../../hooks/useIncomingCallNotifications'
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications'
import useNotificationHub from '../../hooks/useNotificationHub'
import usePushNotification from '../../hooks/usePushNotification'
import useChatWebSocket from '../../hooks/useChatWebSocket'
import usePresenceSync from '../../hooks/usePresenceSync'
import useFriendStore from '../../store/friendStore'

/**
 * Giữ WebSocket subscriptions sống trên mọi trang user (kể cả /call/*).
 */
export default function UserRealtimeSync() {
  const loadPendingRequests = useFriendStore((s) => s.loadPendingRequests)
  const loadFriends = useFriendStore((s) => s.loadFriends)

  useIncomingCallNotifications()
  useFriendRequestNotifications()
  useNotificationHub()
  usePushNotification()
  useChatWebSocket()
  usePresenceSync()

  useEffect(() => {
    loadPendingRequests().catch(() => {})
    loadFriends().catch(() => {})
  }, [loadPendingRequests, loadFriends])

  return <Outlet />
}
