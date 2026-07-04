import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/forgot-password', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">
        Đang chuyển hướng... <Link to="/forgot-password" className="text-indigo-500">Quên mật khẩu</Link>
      </p>
    </div>
  )
}
