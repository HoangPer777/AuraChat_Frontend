import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useFriendStore from '../../store/friendStore'
import useNotificationStore from '../../store/notificationStore'

export const USER_SIDE_RAIL_WIDTH = 80

function SideNavButton({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `w-full flex justify-center py-4 transition-colors ${
          isActive
            ? 'text-primary border-l-4 border-primary bg-primary/5'
            : 'text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent'
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
    </NavLink>
  )
}

export default function UserSideRail() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const pendingRequests = useFriendStore((s) => s.pendingRequests)
  const notificationItems = useNotificationStore((s) => s.items)

  const notificationCount = (() => {
    const unreadStore = notificationItems.filter((item) => !item.read).length
    const pendingNotInStore = (pendingRequests || []).filter(
      (request) => !notificationItems.some((item) => item.id === `friend-${request.id}`),
    ).length
    return unreadStore + pendingNotInStore
  })()

  const avatarSrc =
    user?.avatarUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}`

  return (
    <aside
      className="z-50 flex flex-col justify-between h-screen overflow-y-auto bg-surface-container-low fixed left-0 top-0 w-[80px] items-center py-4 border-r border-outline-variant"
      style={{ width: USER_SIDE_RAIL_WIDTH }}
    >
      <div className="flex flex-col items-center w-full space-y-8">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
          aria-label="AuraChat"
        >
          <span className="material-symbols-outlined text-primary text-[32px]">waves</span>
        </button>

        <nav className="flex flex-col items-center w-full gap-1">
          <SideNavButton to="/chat" icon="chat" label="Tin nhắn" />
          <SideNavButton to="/friends" icon="group" label="Bạn bè" />
          <div className="relative w-full">
            <SideNavButton to="/notifications" icon="notifications" label="Thông báo" />
            {notificationCount > 0 && (
              <span className="absolute top-3 right-5 bg-error text-white text-[10px] min-w-[18px] px-1 py-0.5 rounded-full border-2 border-surface-container-low text-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
          <SideNavButton to="/media" icon="dynamic_feed" label="Bảng tin" />
        </nav>
      </div>

      <div className="w-full flex flex-col items-center pb-4">
        <NavLink
          to="/profile"
          title="Hồ sơ"
          className={({ isActive }) =>
            `w-full flex justify-center py-4 transition-colors rounded-full overflow-hidden ${
              isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low' : 'hover:bg-surface-container-high'
            }`
          }
        >
          <img
            alt="User Profile"
            className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover"
            src={avatarSrc}
          />
        </NavLink>
      </div>
    </aside>
  )
}
