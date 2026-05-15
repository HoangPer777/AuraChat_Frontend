import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useFriendStore from '../../store/friendStore'
import { searchUsers, discoverUsers } from '../../services/friendService'
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications'

function getDisplayName(user) {
  return user?.displayName || user?.name || user?.email || 'Người dùng'
}

function getAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}&background=6366f1&color=fff`
  )
}

// ─── User Card (Discover / Search) ───────────────────────────────────────────
function UserCard({ user, isFriend, onAddFriend, onChat }) {
  const [reqStatus, setReqStatus] = useState('idle') // idle | loading | sent | error

  const handleAdd = async () => {
    setReqStatus('loading')
    try {
      await onAddFriend(user.id)
      setReqStatus('sent')
    } catch {
      setReqStatus('error')
      setTimeout(() => setReqStatus('idle'), 3000)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform">
      <div className="relative mb-3">
        <img
          src={getAvatar(user)}
          className="w-20 h-20 rounded-full object-cover"
          alt={getDisplayName(user)}
        />
      </div>
      <h3 className="font-bold text-base leading-tight">{getDisplayName(user)}</h3>
      <p className="text-xs text-on-surface-variant mb-4 truncate w-full px-2">{user.email}</p>

      <div className="w-full flex gap-2">
        {isFriend ? (
          <>
            <button
              onClick={() => onChat(user.id)}
              className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
            >
              Nhắn tin
            </button>
            <button
              onClick={() => onChat(user.id)}
              className="px-3 py-2 bg-surface-container text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-colors"
              aria-label="Gọi video"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleAdd}
            disabled={reqStatus === 'loading' || reqStatus === 'sent'}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              reqStatus === 'sent'
                ? 'bg-green-100 text-green-700 cursor-default'
                : reqStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : reqStatus === 'loading'
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {reqStatus === 'sent'
              ? '✓ Đã gửi'
              : reqStatus === 'loading'
              ? 'Đang gửi...'
              : reqStatus === 'error'
              ? 'Thử lại'
              : 'Kết bạn'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    friends,
    pendingRequests,
    loadFriends,
    loadPendingRequests,
    acceptRequest,
    declineRequest,
    sendRequest,
    refreshFriendData,
    isLoading,
    isFriend,
  } = useFriendStore()

  const [activeTab, setActiveTab] = useState('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Discover state
  const [discoverList, setDiscoverList] = useState([])
  const [discoverPage, setDiscoverPage] = useState(0)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverHasMore, setDiscoverHasMore] = useState(true)
  const loaderRef = useRef(null)

  useFriendRequestNotifications()

  // Load friends & requests on mount
  useEffect(() => {
    loadFriends().catch(() => {})
    loadPendingRequests().catch(() => {})
  }, [loadFriends, loadPendingRequests])

  // Load discover users
  const loadDiscover = useCallback(async (page, reset = false) => {
    if (discoverLoading) return
    setDiscoverLoading(true)
    try {
      const res = await discoverUsers(page, 18)
      const items = Array.isArray(res?.data) ? res.data : []
      setDiscoverList((prev) => (reset ? items : [...prev, ...items]))
      setDiscoverHasMore(items.length === 18)
      setDiscoverPage(page)
    } catch (err) {
      console.error('Discover error:', err)
    } finally {
      setDiscoverLoading(false)
    }
  }, [discoverLoading])

  useEffect(() => {
    loadDiscover(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && discoverHasMore && !discoverLoading && !searchTerm.trim()) {
          loadDiscover(discoverPage + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [discoverHasMore, discoverLoading, discoverPage, loadDiscover, searchTerm])

  // Search debounce
  useEffect(() => {
    const query = searchTerm.trim()
    if (!query) {
      setSearchResults([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await searchUsers(query)
        if (!active) return
        setSearchResults(Array.isArray(res?.data) ? res.data : [])
      } catch {
        if (active) setSearchResults([])
      } finally {
        if (active) setSearchLoading(false)
      }
    }, 300)
    return () => { active = false; clearTimeout(timer) }
  }, [searchTerm])

  const pendingCount = pendingRequests.length
  const filteredFriends = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return friends
    return friends.filter((f) => getDisplayName(f).toLowerCase().includes(q))
  }, [friends, searchTerm])

  const handleAddFriend = async (receiverId) => {
    await sendRequest(receiverId)
    await refreshFriendData().catch(() => {})
  }

  const handleAccept = async (requestId) => {
    await acceptRequest(requestId)
    await refreshFriendData().catch(() => {})
  }

  const handleDecline = async (requestId) => {
    await declineRequest(requestId)
    await refreshFriendData().catch(() => {})
  }

  const handleRefresh = async () => {
    await refreshFriendData().catch(() => {})
    await loadDiscover(0, true)
  }

  // Decide what to show on the right panel
  const isSearching = searchTerm.trim().length > 0
  const rightItems = isSearching ? searchResults : discoverList

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex font-sans">
      {/* ── Sidebar icon nav ── */}
      <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
        <div className="flex flex-col items-center w-full gap-4">
          <button
            onClick={() => navigate('/chat')}
            className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button className="text-primary border-l-4 border-primary w-full flex justify-center py-4 bg-primary/5">
            <span className="material-symbols-outlined">group</span>
          </button>
          <button
            onClick={() => navigate('/test-ui/notifications')}
            className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="w-full flex flex-col items-center pb-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex justify-center py-2"
          >
            <img
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover"
              src={getAvatar(user)}
            />
          </button>
        </div>
      </aside>

      {/* ── Left panel: Friends / Requests ── */}
      <div className="w-[300px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 border-b border-outline-variant">
          <h1 className="text-xl font-bold mb-3">Bạn bè</h1>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              className="w-full pl-9 pr-4 py-2 bg-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Tìm bạn bè..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant text-sm font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 transition-all ${
              activeTab === 'friends'
                ? 'text-primary border-b-2 border-primary'
                : 'text-outline hover:bg-surface-container'
            }`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'requests'
                ? 'text-primary border-b-2 border-primary'
                : 'text-outline hover:bg-surface-container'
            }`}
          >
            Lời mời
            {pendingCount > 0 && (
              <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'friends' ? (
            isLoading && friends.length === 0 ? (
              <p className="text-center text-outline py-8 text-sm">Đang tải...</p>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img
                      src={getAvatar(friend)}
                      className="w-11 h-11 rounded-full object-cover"
                      alt={getDisplayName(friend)}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{getDisplayName(friend)}</p>
                    <p className="text-[11px] text-outline truncate">
                      {friend.since
                        ? `Bạn từ ${new Date(friend.since).toLocaleDateString('vi-VN')}`
                        : 'Bạn bè'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/chat', { state: { friendId: friend.id } })}
                    className="text-primary p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                    aria-label="Nhắn tin"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-outline py-8 text-sm">Chưa có bạn bè</p>
            )
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all"
              >
                <img
                  src={getAvatar(req.sender)}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                  alt={getDisplayName(req.sender)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getDisplayName(req.sender)}</p>
                  <p className="text-[11px] text-outline truncate">{req.sender?.email}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="text-primary p-1.5 hover:bg-primary/10 rounded-full"
                    aria-label="Chấp nhận"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="text-error p-1.5 hover:bg-error/10 rounded-full"
                    aria-label="Từ chối"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-outline py-8 text-sm">Không có lời mời nào</p>
          )}
        </div>
      </div>

      {/* ── Right panel: Discover / Search ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-outline-variant bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">
              {isSearching ? `Kết quả tìm kiếm "${searchTerm}"` : 'Khám phá người dùng'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {isSearching
                ? `${searchResults.length} kết quả`
                : 'Những người bạn chưa kết bạn trong hệ thống'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tải lại
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isSearching && searchLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isSearching && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-outline">
              <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
              <p className="text-sm">Không tìm thấy người dùng nào</p>
            </div>
          ) : rightItems.length === 0 && !discoverLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-outline">
              <span className="material-symbols-outlined text-5xl mb-3">group_off</span>
              <p className="text-sm">Không có người dùng nào để khám phá</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {rightItems.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isFriend={isFriend(u.id)}
                    onAddFriend={handleAddFriend}
                    onChat={(id) => navigate('/chat', { state: { friendId: id } })}
                  />
                ))}
              </div>

              {/* Infinite scroll loader (only for discover, not search) */}
              {!isSearching && (
                <div ref={loaderRef} className="flex justify-center py-6">
                  {discoverLoading && (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {!discoverLoading && !discoverHasMore && discoverList.length > 0 && (
                    <p className="text-sm text-outline">Đã hiển thị tất cả người dùng</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
