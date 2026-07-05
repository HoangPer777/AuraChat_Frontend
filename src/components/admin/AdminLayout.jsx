import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getModerationStats } from '../../services/adminService'

const navItems = [
  { to: '/admin/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { to: '/admin/moderation', icon: 'shield', label: 'Nội dung nhạy cảm', badgeKey: 'moderation' },
  { to: '/admin/users', icon: 'group', label: 'Quản lý người dùng' },
  { to: '/admin/posts', icon: 'article', label: 'Quản lý bài đăng' },
  { to: '/admin/media', icon: 'perm_media', label: 'Quản lý media' },
  { to: '/admin/banned-ips', icon: 'gpp_bad', label: 'IP bị chặn' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [pendingModeration, setPendingModeration] = useState(0)

  useEffect(() => {
    getModerationStats()
      .then((stats) => setPendingModeration(stats?.pendingTotal || 0))
      .catch(() => setPendingModeration(0))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderNavLink = (item, mobile = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      aria-label={item.label}
      className={({ isActive }) => mobile
        ? `p-2 rounded-lg relative ${isActive ? 'bg-primary-container text-primary' : 'text-on-surface-variant'}`
        : `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all relative ${
          isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
    >
      <span className="material-symbols-outlined">{item.icon}</span>
      {!mobile && <span className="flex-1">{item.label}</span>}
      {item.badgeKey === 'moderation' && pendingModeration > 0 && (
        <span className={`${mobile ? 'absolute -top-0.5 -right-0.5' : 'ml-auto'} min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold`}>
          {pendingModeration > 99 ? '99+' : pendingModeration}
        </span>
      )}
    </NavLink>
  )

  return (
    <div className="bg-surface-bright text-on-surface min-h-screen font-sans">
      <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col py-6 px-3 gap-4 z-50">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold text-primary">AuraChat</h1>
          <p className="text-xs text-on-surface-variant font-medium">Quản trị viên</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => renderNavLink(item))}
        </nav>
        <div className="border-t border-outline-variant pt-4 px-2">
          <p className="font-bold text-sm truncate">{user?.displayName || 'Admin'}</p>
          <p className="text-xs text-on-surface-variant truncate mb-3">{user?.email}</p>
          <button onClick={handleLogout} className="text-sm text-error hover:underline">Đăng xuất</button>
        </div>
      </aside>
      <nav className="md:hidden flex items-center justify-between gap-2 px-3 py-3 bg-surface-container-low border-b border-outline-variant">
        <span className="font-bold text-primary">AuraChat Admin</span>
        <div className="flex gap-1">
          {navItems.map((item) => renderNavLink(item, true))}
          <button onClick={handleLogout} className="p-2 text-error" aria-label="Đăng xuất"><span className="material-symbols-outlined">logout</span></button>
        </div>
      </nav>
      <main className="md:ml-[240px] min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
