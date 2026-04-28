import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Kiểm tra email của bạn</h2>
          <p className="text-gray-500 text-sm mb-6">
            Nếu email <span className="font-medium text-gray-700">{email}</span> tồn tại trong hệ thống,
            chúng tôi đã gửi mã OTP 6 số. Mã có hiệu lực trong 10 phút.
          </p>
          <Link
            to="/reset-password"
            className="inline-block w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition text-center"
          >
            Nhập mã OTP
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-sm text-gray-400 hover:underline"
          >
            Gửi lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Quên mật khẩu</h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-500 hover:underline">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
