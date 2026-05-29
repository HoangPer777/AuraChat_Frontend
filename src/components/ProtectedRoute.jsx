import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * ProtectedRoute Component
 * 
 * Guards protected routes by checking if user is authenticated.
 * - Kiểm tra accessToken từ Zustand store hoặc localStorage (fallback)
 * - Nếu không có token, redirect về login
 */
function ProtectedRoute() {
  const { accessToken } = useAuthStore()

  // Fallback to localStorage in case Zustand hasn't propagated yet
  const token = accessToken || localStorage.getItem('accessToken')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
