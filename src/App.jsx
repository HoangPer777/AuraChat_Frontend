import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, Component } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './store/authStore'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import OAuth2CallbackPage from './pages/auth/OAuth2CallbackPage'
import ChatPage from './pages/chat/ChatPage'
import FindUsersPage from './pages/FindUsersPage'
import HomePage from './pages/chat/HomePage'
import ChatWindowPage from './pages/chat/ChatWindowPage'
import FriendsPage from './pages/chat/FriendsPage'
import CreateGroupPage from './pages/chat/CreateGroupPage'
import NotificationsPage from './pages/chat/NotificationsPage'
import IncomingCallPage from './pages/call/IncomingCallPage'
import CallingPage from './pages/call/CallingPage'
import AudioCallPage from './pages/call/AudioCallPage'
import VideoCallPage from './pages/call/VideoCallPage'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import ProfilePageNew from './pages/chat/ProfilePage'
import MediaLibraryPage from './pages/media/MediaLibraryPage'

// Lazy load ProfilePage for code splitting
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'))

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}

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
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/users" element={<FindUsersPage />} />
            <Route path="/media" element={<MediaLibraryPage />} />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ProfilePage />
                </Suspense>
              }
            />
          </Route>

          {/* Test UI Routes */}
          <Route path="/test-ui/home" element={<HomePage />} />
          <Route path="/test-ui/chat" element={<ChatWindowPage />} />
          <Route path="/test-ui/friends" element={<FriendsPage />} />
          <Route path="/test-ui/create-group" element={<CreateGroupPage />} />
          <Route path="/test-ui/profile-new" element={<ProfilePageNew />} />
          <Route path="/test-ui/notifications" element={<NotificationsPage />} />
          <Route path="/test-ui/incoming-call" element={<IncomingCallPage />} />
          <Route path="/test-ui/calling" element={<CallingPage />} />
          <Route path="/test-ui/audio-call" element={<AudioCallPage />} />
          <Route path="/test-ui/video-call" element={<VideoCallPage />} />
          <Route path="/test-ui/admin-dashboard" element={<DashboardPage />} />
          <Route path="/test-ui/admin-users" element={<UsersPage />} />

          {/* 404 Fallback */}
          <Route path="/404" element={<div className="flex items-center justify-center min-h-screen text-2xl">Page Not Found</div>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
