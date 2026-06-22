import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * MainLayout Component
 * 
 * Main layout wrapper for protected pages (Chat, Profile).
 * Provides:
 * - Top navigation bar with user menu
 * - Responsive design for mobile, tablet, and desktop
 * - Navigation links to chat and profile pages
 * - User avatar and logout button
 * 
 * Requirements: 16 (Protected Routes), 19 (Responsive UI Design)
 */
function MainLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link to="/chat" className="text-2xl font-bold text-blue-600">
                AuraChat
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/chat')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Chat
              </Link>
              <Link
                to="/users"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/users')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Tìm người dùng
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Profile
              </Link>
              <Link
                to="/media"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/media')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Media
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:bg-purple-50"
                >
                  Quản trị
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user?.displayName || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                    {/* Mobile Navigation Links */}
                    <div className="md:hidden px-4 py-2 border-b border-gray-200">
                      <Link
                        to="/chat"
                        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Chat
                      </Link>
                      <Link
                        to="/users"
                        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Tìm người dùng
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/media"
                        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Media
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:bg-purple-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Quản trị
                        </Link>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default MainLayout
