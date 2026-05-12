import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * ProtectedRoute Component
 * 
 * Guards protected routes by checking if user is authenticated.
 * - Chỉ cần accessToken là đủ để vào route (user được load lazy)
 * - Nếu không có token, redirect về login
 */
function ProtectedRoute() {
  const { accessToken } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
