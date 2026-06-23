import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import useIncomingCallNotifications from '../../hooks/useIncomingCallNotifications'
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications'
import useChatWebSocket from '../../hooks/useChatWebSocket'
import useFriendStore from '../../store/friendStore'
import UserSideRail, { USER_SIDE_RAIL_WIDTH } from './UserSideRail'
import UserFooter from './UserFooter'

export default function UserLayout() {
  const loadPendingRequests = useFriendStore((s) => s.loadPendingRequests)

  useIncomingCallNotifications()
  useFriendRequestNotifications()
  useChatWebSocket()

  useEffect(() => {
    loadPendingRequests().catch(() => {})
  }, [loadPendingRequests])

  return (
    <div className="bg-surface-container-low text-on-surface h-screen overflow-hidden font-sans">
      <UserSideRail />
      <div
        className="h-screen flex flex-col min-w-0"
        style={{ marginLeft: USER_SIDE_RAIL_WIDTH }}
      >
        <Outlet />
      </div>
      <UserFooter />
    </div>
  )
}
