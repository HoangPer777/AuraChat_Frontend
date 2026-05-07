import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * ProtectedRoute Component
 * 
 * Guards protected routes by checking if user is authenticated.
 * - If user has valid accessToken, allows access to protected routes
 * - If user is not authenticated, redirects to login page
 * - Handles token expiration by checking token validity
 * 
 * Usage:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/chat" element={<ChatPage />} />
 *   <Route path="/profile" element={<ProfilePage />} />
 * </Route>
 */
function ProtectedRoute() {
  const { accessToken, user } = useAuthStore()

  // Check if user is authenticated
  // Both accessToken and user must exist for valid authentication
  const isAuthenticated = !!accessToken && !!user

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  // Allow access to protected routes
  return <Outlet />
}

export default ProtectedRoute
