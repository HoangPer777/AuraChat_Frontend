import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'

/**
 * Trang này nhận accessToken + refreshToken từ query param
 * sau khi backend redirect về từ OAuth2 (Google/Facebook).
 * URL: /oauth2/callback?accessToken=...&refreshToken=...
 */
export default function OAuth2CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')

    if (!accessToken || !refreshToken) {
      navigate('/login')
      return
    }

    // Lấy thông tin user bằng token vừa nhận
    api
      .get('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(({ data }) => {
        setAuth(data, accessToken, refreshToken)
        navigate('/chat')
      })
      .catch(() => navigate('/login'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Đang xác thực...</p>
      </div>
    </div>
  )
}
