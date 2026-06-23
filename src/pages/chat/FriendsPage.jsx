import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useFriendStore from '../../store/friendStore'
import useChatStore from '../../store/chatStore'
import usePresenceStore from '../../store/presenceStore'
import { searchUsers, discoverUsers } from '../../services/friendService'
import { startOutgoingVideoCall, startOutgoingAudioCall } from '../../utils/callHelpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Online dot ───────────────────────────────────────────────────────────────
function OnlineDot({ userId }) {
  const isOnline = useChatStore((state) => Boolean(userId && state.onlineByUserId[userId]))
  return (
    <span
      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`}
    />
  )
}

// ─── User Profile Drawer ──────────────────────────────────────────────────────
function ProfileDrawer({ user, isFriend, onClose, onChat, onVideoCall, onAudioCall, onAddFriend, onUnfriend }) {
  const presenceMap = usePresenceStore((s) => s.presenceMap)
  const presence = presenceMap[user?.id]
  const isOnline = useChatStore((state) => Boolean(user?.id && state.onlineByUserId[user.id]))
  const [reqStatus, setReqStatus] = useState('idle')
  const [unfriendConfirm, setUnfriendConfirm] = useState(false)

  if (!user) return null

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

  const handleUnfriend = async () => {
    if (!unfriendConfirm) { setUnfriendConfirm(true); return }
    try {
      await onUnfriend(user.id)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[340px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-outline-variant shrink-0">
          <span className="font-bold text-base">Thông tin người dùng</span>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src={getAvatar(user)}
                alt={getDisplayName(user)}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/10"
              />
              <OnlineDot userId={user.id} />
            </div>
            <h3 className="text-xl font-bold">{getDisplayName(user)}</h3>
            <p className="text-sm text-on-surface-variant">{user.email}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isOnline
                ? 'Đang hoạt động'
                : presence?.lastSeen
                ? `Hoạt động ${new Date(presence.lastSeen).toLocaleString('vi-VN')}`
                : 'Không hoạt động'}
            </span>
          </div>

          {/* Info rows */}
          {isFriend && (
            <div className="bg-surface-container rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span className="truncate">{user.email}</span>
              </div>
              {user.since && (
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>Bạn bè từ {new Date(user.since).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isFriend ? (
              <>
                <button
                  onClick={() => { onChat(user.id); onClose() }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Nhắn tin
                </button>
                <button
                  onClick={() => { onAudioCall(user); onClose() }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  Gọi thoại
                </button>
                <button
                  onClick={() => { onVideoCall(user); onClose() }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                  Gọi video
                </button>
                <button
                  onClick={handleUnfriend}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    unfriendConfirm
                      ? 'bg-red-600 text-white'
                      : 'bg-error-container text-error hover:bg-error/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">person_remove</span>
                  {unfriendConfirm ? 'Xác nhận hủy kết bạn?' : 'Hủy kết bạn'}
                </button>
                {unfriendConfirm && (
                  <button
                    onClick={() => setUnfriendConfirm(false)}
                    className="w-full py-2 text-sm text-on-surface-variant hover:underline"
                  >
                    Hủy bỏ
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleAdd}
                disabled={reqStatus === 'loading' || reqStatus === 'sent'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  reqStatus === 'sent'
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : reqStatus === 'error'
                    ? 'bg-red-100 text-red-700'
                    : reqStatus === 'loading'
                    ? 'bg-surface-container text-outline cursor-not-allowed'
                    : 'bg-primary text-white hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                {reqStatus === 'sent' ? '✓ Đã gửi lời mời' : reqStatus === 'loading' ? 'Đang gửi...' : reqStatus === 'error' ? 'Thử lại' : 'Kết bạn'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Discover / Search Card ───────────────────────────────────────────────────
function UserCard({ user, isFriend, onAddFriend, onChat, onVideoCall, onAudioCall, onViewProfile }) {
  const [reqStatus, setReqStatus] = useState('idle')

  const handleAdd = async (e) => {
    e.stopPropagation()
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
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center hover:-translate-y-0.5 transition-transform cursor-pointer"
      onClick={() => onViewProfile(user)}
    >
      <div className="relative mb-3">
        <img src={getAvatar(user)} className="w-20 h-20 rounded-full object-cover" alt={getDisplayName(user)} />
        <OnlineDot userId={user.id} />
      </div>
      <h3 className="font-bold text-sm leading-tight truncate w-full">{getDisplayName(user)}</h3>
      <p className="text-xs text-on-surface-variant mb-4 truncate w-full">{user.email}</p>

      <div className="w-full flex gap-2" onClick={(e) => e.stopPropagation()}>
        {isFriend ? (
          <>
            <button
              onClick={() => onChat(user.id)}
              className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
            >
              Nhắn tin
            </button>
            <button
              onClick={() => onAudioCall(user)}
              className="px-3 py-2 bg-surface-container text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-colors"
              aria-label="Gọi thoại"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
            </button>
            <button
              onClick={() => onVideoCall(user)}
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
            {reqStatus === 'sent' ? '✓ Đã gửi' : reqStatus === 'loading' ? '...' : reqStatus === 'error' ? 'Thử lại' : 'Kết bạn'}
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
    friends, pendingRequests,
    loadFriends, loadPendingRequests,
    acceptRequest, declineRequest,
    sendRequest, removeFriend,
    refreshFriendData, isLoading,
  } = useFriendStore()

  // Tính isFriend từ friends array thay vì dùng store method
  const isFriend = useCallback((userId) => friends.some((f) => f.id === userId), [friends])

  const [activeTab, setActiveTab] = useState('friends') // friends | requests
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Discover
  const [discoverList, setDiscoverList] = useState([])
  const [discoverPage, setDiscoverPage] = useState(0)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverHasMore, setDiscoverHasMore] = useState(true)
  const loaderRef = useRef(null)
  const discoverLoadingRef = useRef(false)

  // Profile drawer
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadFriends().catch(() => {})
    loadPendingRequests().catch(() => {})
  }, [loadFriends, loadPendingRequests])

  // Load discover
  const loadDiscover = useCallback(async (page, reset = false) => {
    if (discoverLoadingRef.current && !reset) return
    discoverLoadingRef.current = true
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
      discoverLoadingRef.current = false
      setDiscoverLoading(false)
    }
  }, [])

  useEffect(() => { loadDiscover(0, true) }, [loadDiscover])

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && discoverHasMore && !discoverLoading && !searchTerm.trim()) {
          loadDiscover(discoverPage + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [discoverHasMore, discoverLoading, discoverPage, loadDiscover, searchTerm])

  // Search debounce
  useEffect(() => {
    const q = searchTerm.trim()
    if (!q) { setSearchResults([]); return }
    let active = true
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await searchUsers(q)
        if (active) setSearchResults(Array.isArray(res?.data) ? res.data : [])
      } catch { if (active) setSearchResults([]) }
      finally { if (active) setSearchLoading(false) }
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

  const handleUnfriend = async (friendId) => {
    await removeFriend(friendId)
    await refreshFriendData().catch(() => {})
  }

  const handleRefresh = async () => {
    await refreshFriendData().catch(() => {})
    await loadDiscover(0, true)
  }

  const handleChat = (friendId) => navigate('/chat/window', { state: { friendId } })

  const handleVideoCall = (friend) => {
    if (!friend?.id) return

    startOutgoingVideoCall(navigate, {
      receiverId: friend.id,
      receiverName: getDisplayName(friend),
      receiverAvatar: getAvatar(friend),
    })
  }

  const handleAudioCall = (friend) => {
    if (!friend?.id) return

    startOutgoingAudioCall(navigate, {
      receiverId: friend.id,
      receiverName: getDisplayName(friend),
      receiverAvatar: getAvatar(friend),
    })
  }

  const isSearching = searchTerm.trim().length > 0
  const rightItems = isSearching ? searchResults : discoverList

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex flex-1 font-sans">

      {/* ── Left panel ── */}
      <div className="w-[300px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 border-b border-outline-variant shrink-0">
          <h1 className="text-xl font-bold mb-3">Bạn bè</h1>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
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
          <TabBtn label="Bạn bè" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} />
          <TabBtn
            label="Lời mời"
            active={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
            badge={pendingCount}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {activeTab === 'friends' ? (
            isLoading && friends.length === 0 ? (
              <p className="text-center text-outline py-8 text-sm">Đang tải...</p>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onChat={handleChat}
                  onVideoCall={handleVideoCall}
                  onAudioCall={handleAudioCall}
                  onViewProfile={() => setSelectedUser({ ...friend, _isFriend: true })}
                />
              ))
            ) : (
              <EmptyState icon="group" text={searchTerm ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè'} />
            )
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <RequestRow
                key={req.id}
                req={req}
                onAccept={() => acceptRequest(req.id).then(() => refreshFriendData().catch(() => {}))}
                onDecline={() => declineRequest(req.id).then(() => refreshFriendData().catch(() => {}))}
                onViewProfile={() => setSelectedUser(req.sender)}
              />
            ))
          ) : (
            <EmptyState icon="mark_email_unread" text="Không có lời mời nào" />
          )}
        </div>
      </div>

      {/* ── Right panel: Discover / Search ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="px-8 py-4 border-b border-outline-variant bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">
              {isSearching ? `Kết quả cho "${searchTerm}"` : 'Khám phá người dùng'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isSearching
                ? `${searchResults.length} kết quả`
                : 'Những người bạn chưa kết bạn trong hệ thống'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Tải lại
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isSearching && searchLoading ? (
            <Spinner />
          ) : isSearching && searchResults.length === 0 ? (
            <EmptyState icon="search_off" text="Không tìm thấy người dùng nào" large />
          ) : rightItems.length === 0 && !discoverLoading ? (
            <EmptyState icon="group_off" text="Không có người dùng nào để khám phá" large />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {rightItems.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isFriend={isFriend(u.id)}
                    onAddFriend={handleAddFriend}
                    onChat={handleChat}
                    onVideoCall={handleVideoCall}
                    onAudioCall={handleAudioCall}
                    onViewProfile={(u) => setSelectedUser({ ...u, _isFriend: isFriend(u.id) })}
                  />
                ))}
              </div>
              {/* Infinite scroll trigger */}
              {!isSearching && (
                <div ref={loaderRef} className="flex justify-center py-6">
                  {discoverLoading && <Spinner />}
                  {!discoverLoading && !discoverHasMore && discoverList.length > 0 && (
                    <p className="text-sm text-outline">Đã hiển thị tất cả</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Profile Drawer ── */}
      {selectedUser && (
        <ProfileDrawer
          user={selectedUser}
          isFriend={selectedUser._isFriend ?? isFriend(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
          onChat={handleChat}
          onVideoCall={handleVideoCall}
          onAudioCall={handleAudioCall}
          onAddFriend={handleAddFriend}
          onUnfriend={handleUnfriend}
        />
      )}
    </div>
  )
}

// ─── Small sub-components ─────────────────────────────────────────────────────
function TabBtn({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-all text-sm ${
        active ? 'text-primary border-b-2 border-primary' : 'text-outline hover:bg-surface-container'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

function FriendRow({ friend, onChat, onVideoCall, onAudioCall, onViewProfile }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer"
      onClick={onViewProfile}
    >
      <div className="relative shrink-0">
        <img src={getAvatar(friend)} className="w-11 h-11 rounded-full object-cover" alt={getDisplayName(friend)} />
        <OnlineDot userId={friend.id} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{getDisplayName(friend)}</p>
        <p className="text-[11px] text-outline truncate">
          {friend.since ? `Bạn từ ${new Date(friend.since).toLocaleDateString('vi-VN')}` : 'Bạn bè'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onChat(friend.id)}
          className="text-primary p-1.5 hover:bg-primary/10 rounded-full transition-colors"
          aria-label="Nhắn tin"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </button>
        <button
          onClick={() => onAudioCall(friend)}
          className="text-on-surface-variant p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="Gọi thoại"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
        </button>
        <button
          onClick={() => onVideoCall(friend)}
          className="text-on-surface-variant p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="Gọi video"
        >
          <span className="material-symbols-outlined text-[20px]">videocam</span>
        </button>
      </div>
    </div>
  )
}

function RequestRow({ req, onAccept, onDecline, onViewProfile }) {
  const sender = req.sender
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer"
      onClick={onViewProfile}
    >
      <img src={getAvatar(sender)} className="w-11 h-11 rounded-full object-cover shrink-0" alt={getDisplayName(sender)} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{getDisplayName(sender)}</p>
        <p className="text-[11px] text-outline truncate">{sender?.email}</p>
      </div>
      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={onAccept} className="text-primary p-1.5 hover:bg-primary/10 rounded-full" aria-label="Chấp nhận">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
        </button>
        <button onClick={onDecline} className="text-error p-1.5 hover:bg-error/10 rounded-full" aria-label="Từ chối">
          <span className="material-symbols-outlined text-[20px]">cancel</span>
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon, text, large }) {
  return (
    <div className={`flex flex-col items-center justify-center text-outline ${large ? 'py-20' : 'py-8'}`}>
      <span className={`material-symbols-outlined mb-2 ${large ? 'text-5xl' : 'text-3xl'}`}>{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
