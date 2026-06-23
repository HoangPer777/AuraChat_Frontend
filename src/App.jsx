import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Component } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './store/authStore'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OAuth2CallbackPage from './pages/auth/OAuth2CallbackPage'
import HomePage from './pages/chat/HomePage'
import ChatWindowPage from './pages/chat/ChatWindowPage'
import FriendsPage from './pages/chat/FriendsPage'
import CreateGroupPage from './pages/chat/CreateGroupPage'
import NotificationsPage from './pages/chat/NotificationsPage'
import IncomingCallPage from './pages/call/IncomingCallPage'
import CallingPage from './pages/call/CallingPage'
import VideoCallPage from './pages/call/VideoCallPage'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import BannedIpsPage from './pages/admin/BannedIpsPage'
import AdminLayout from './components/admin/AdminLayout'
import UserLayout from './components/user/UserLayout'
import UserRealtimeSync from './components/user/UserRealtimeSync'
import ProfilePageNew from './pages/chat/ProfilePage'
import MediaLibraryPage from './pages/media/MediaLibraryPage'

// Error Boundary để bắt crash thay vì trang trắng
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Đã xảy ra lỗi</h1>
            <p className="text-gray-600 mb-4 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const { accessToken } = useAuthStore()
  const isAuthenticated = !!(accessToken || localStorage.getItem('accessToken'))

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes — redirect to /chat if already logged in */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/oauth/callback" element={<OAuth2CallbackPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserRealtimeSync />}>
              <Route element={<UserLayout />}>
                <Route path="/chat" element={<HomePage />} />
                <Route path="/chat/window" element={<ChatWindowPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/create-group" element={<CreateGroupPage />} />
                <Route path="/media" element={<MediaLibraryPage />} />
                <Route path="/profile" element={<ProfilePageNew />} />
                <Route path="/users" element={<Navigate to="/friends" replace />} />
              </Route>
              <Route path="/call/incoming" element={<IncomingCallPage />} />
              <Route path="/call/outgoing" element={<CallingPage />} />
              <Route path="/call/audio" element={<VideoCallPage />} />
              <Route path="/call/video" element={<VideoCallPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/banned-ips" element={<BannedIpsPage />} />
            </Route>
          </Route>

          {/* Legacy UI redirects */}
          <Route path="/test-ui/home" element={<Navigate to="/chat" replace />} />
          <Route path="/test-ui/chat" element={<Navigate to="/chat/window" replace />} />
          <Route path="/test-ui/friends" element={<Navigate to="/friends" replace />} />
          <Route path="/test-ui/create-group" element={<Navigate to="/create-group" replace />} />
          <Route path="/test-ui/profile-new" element={<Navigate to="/profile" replace />} />
          <Route path="/test-ui/notifications" element={<Navigate to="/notifications" replace />} />
          <Route path="/test-ui/incoming-call" element={<Navigate to="/call/incoming" replace />} />
          <Route path="/test-ui/calling" element={<Navigate to="/call/outgoing" replace />} />
          <Route path="/test-ui/audio-call" element={<Navigate to="/call/audio" replace />} />
          <Route path="/test-ui/video-call" element={<Navigate to="/call/video" replace />} />
          <Route path="/test-ui/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/test-ui/admin-users" element={<Navigate to="/admin/users" replace />} />

          {/* 404 Fallback */}
          <Route path="/404" element={<div className="flex items-center justify-center min-h-screen text-2xl">Page Not Found</div>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
