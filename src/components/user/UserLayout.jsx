import { Outlet } from 'react-router-dom'
import UserSideRail, { USER_SIDE_RAIL_WIDTH } from './UserSideRail'
import UserFooter from './UserFooter'

export default function UserLayout() {
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
