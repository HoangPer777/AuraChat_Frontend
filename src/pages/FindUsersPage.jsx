import { useState, useCallback } from 'react'
import MainLayout from '../components/MainLayout'
import api from '../services/api'

// Debounce hook
function useDebounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

function UserCard({ user, onSendRequest }) {
  const [status, setStatus] = useState('idle') // idle | loading | sent | error

  const handleRequest = async () => {
    setStatus('loading')
    try {
      await onSendRequest(user.id)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Avatar */}
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="h-14 w-14 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">
            {user.displayName?.charAt(0)?.toUpperCase() ||
              user.email?.charAt(0)?.toUpperCase() ||
              'U'}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {user.displayName || 'Người dùng'}
        </p>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Action */}
      <button
        onClick={handleRequest}
        disabled={status === 'loading' || status === 'sent'}
        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          status === 'sent'
            ? 'bg-green-100 text-green-700 cursor-default'
            : status === 'error'
            ? 'bg-red-100 text-red-700'
            : status === 'loading'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'sent'
          ? '✓ Đã gửi'
          : status === 'loading'
          ? 'Đang gửi...'
          : status === 'error'
          ? 'Thử lại'
          : 'Kết bạn'}
      </button>
    </div>
  )
}

export default function FindUsersPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const searchUsers = async (q) => {
    if (!q.trim()) {
      setUsers([])
      setHasSearched(false)
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(`/friends/search?q=${encodeURIComponent(q.trim())}`)
      setUsers(response.data?.data || [])
      setHasSearched(true)
    } catch (err) {
      setError('Không thể tìm kiếm. Vui lòng thử lại.')
      console.error('Search users error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    (() => {
      let timer
      return (q) => {
        clearTimeout(timer)
        timer = setTimeout(() => searchUsers(q), 400)
      }
    })(),
    []
  )

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    debouncedSearch(val)
  }

  const handleSendRequest = async (receiverId) => {
    const response = await api.post('/friends/request', { receiverId })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Gửi lời mời thất bại')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tìm kiếm người dùng</h1>
          <p className="text-gray-500 mt-1">Tìm và gửi lời mời kết bạn</p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setUsers([]); setHasSearched(false) }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {!query.trim() && !hasSearched ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Nhập tên hoặc email để tìm kiếm</p>
          </div>
        ) : hasSearched && users.length === 0 && !isLoading ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Không tìm thấy người dùng nào cho <strong>"{query}"</strong></p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} onSendRequest={handleSendRequest} />
            ))}
            {users.length > 0 && (
              <p className="text-center text-sm text-gray-400 pt-2">
                {users.length} kết quả
              </p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
