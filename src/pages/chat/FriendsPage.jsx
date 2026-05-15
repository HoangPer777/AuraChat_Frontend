import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useFriendStore from '../../store/friendStore'
import { searchUsers } from '../../services/friendService'
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications'

function getDisplayName(user) {
  return user?.displayName || user?.name || user?.email || 'Người dùng'
}

function getAvatar(user) {
  return user?.avatarUrl || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`
}

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
  } = useFriendStore()
  const [activeTab, setActiveTab] = useState('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  useFriendRequestNotifications()

  useEffect(() => {
    loadFriends().catch(() => {})
    loadPendingRequests().catch(() => {})
  }, [loadFriends, loadPendingRequests])

  useEffect(() => {
    const query = searchTerm.trim()

    if (!query) {
      setSearchResults([])
      return undefined
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await searchUsers(query)
        if (!active) return
        const results = Array.isArray(response?.data) ? response.data : []
        setSearchResults(results)
      } catch (error) {
        console.error('Error searching users:', error)
        if (active) {
          setSearchResults([])
        }
      } finally {
        if (active) {
          setSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  const pendingCount = pendingRequests.length
  const filteredFriends = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return friends
    return friends.filter((friend) => getDisplayName(friend).toLowerCase().includes(query))
  }, [friends, searchTerm])

  const handleStartChat = (friendId) => {
    navigate('/chat', { state: { friendId } })
  }

  const handleAddFriend = async (receiverId) => {
    try {
      await sendRequest(receiverId)
      await refreshFriendData().catch(() => {})
    } catch (error) {
      console.error('Failed to send friend request:', error)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest(requestId)
      await refreshFriendData().catch(() => {})
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  const handleDeclineRequest = async (requestId) => {
    try {
      await declineRequest(requestId)
      await refreshFriendData().catch(() => {})
    } catch (error) {
      console.error('Failed to decline friend request:', error)
    }
  }

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex font-sans">
      <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
        <div className="flex flex-col items-center w-full gap-4">
          <button onClick={() => navigate('/chat')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">group</span>
          </button>
          <button onClick={() => navigate('/test-ui/notifications')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="w-full flex flex-col items-center pb-4">
          <button onClick={() => navigate('/profile')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors rounded-full overflow-hidden">
            <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatarUrl || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}`} />
          </button>
        </div>
      </aside>

      <div className="w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 border-b border-outline-variant">
          <h1 className="text-xl font-bold mb-4">Bạn bè</h1>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm"
              placeholder="Tìm bạn bè..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>
        <div className="flex border-b border-outline-variant text-sm font-bold">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 transition-all ${activeTab === 'friends' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:bg-surface-container'}`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all ${activeTab === 'requests' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:bg-surface-container'}`}
          >
            Lời mời {pendingCount > 0 && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'friends' ? (
            isLoading && friends.length === 0 ? (
              <p className="text-center text-outline py-8 text-sm">Đang tải danh sách bạn bè...</p>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                  <div className="relative shrink-0">
                    <img src={getAvatar(friend)} className="w-12 h-12 rounded-full object-cover" alt={getDisplayName(friend)} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{getDisplayName(friend)}</p>
                    <p className="text-[11px] text-outline truncate">Bạn bè từ {friend.since ? new Date(friend.since).toLocaleDateString('vi-VN') : 'trước đó'}</p>
                  </div>
                  <button onClick={() => handleStartChat(friend.id)} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors" aria-label="Nhắn tin">
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-outline py-8 text-sm">Chưa có bạn bè</p>
            )
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => {
              const sender = req.sender
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                  <img src={getAvatar(sender)} className="w-12 h-12 rounded-full object-cover shrink-0" alt={getDisplayName(sender)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{getDisplayName(sender)}</p>
                    <p className="text-[11px] text-outline truncate">{sender?.email || 'Lời mời kết bạn'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleAcceptRequest(req.id)} className="text-primary p-2 hover:bg-primary/10 rounded-full" aria-label="Chấp nhận">
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                    <button onClick={() => handleDeclineRequest(req.id)} className="text-error p-2 hover:bg-error/10 rounded-full" aria-label="Từ chối">
                      <span className="material-symbols-outlined">cancel</span>
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-outline py-8 text-sm">Không có lời mời kết bạn nào</p>
          )}
        </div>
      </div>

      <main className="flex-1 bg-surface-bright p-10 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold">Tìm người dùng</h2>
            <p className="text-sm text-on-surface-variant mt-1">Gửi lời mời trước, rồi sau khi được chấp nhận bạn mới gọi được.</p>
          </div>
          <button onClick={() => refreshFriendData().catch(() => {})} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all">
            <span className="material-symbols-outlined">refresh</span>
            Tải lại
          </button>
        </header>

        {searchTerm.trim() ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {searchLoading ? (
              <div className="col-span-full text-sm text-outline">Đang tìm kiếm...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => {
                const alreadyFriend = friends.some((friend) => friend.id === result.id)
                return (
                  <div key={result.id} className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                    <div className="relative mb-4">
                      <img src={getAvatar(result)} className="w-24 h-24 rounded-full object-cover" alt={getDisplayName(result)} />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-lg">{getDisplayName(result)}</h3>
                    <p className="text-sm text-on-surface-variant mb-6 truncate w-full px-4">{result.email || 'Người dùng AuraChat'}</p>
                    <div className="w-full flex gap-2">
                      <button
                        onClick={() => handleAddFriend(result.id)}
                        disabled={alreadyFriend}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${alreadyFriend ? 'bg-surface-container text-outline cursor-not-allowed' : 'bg-primary text-white hover:opacity-90'}`}
                      >
                        {alreadyFriend ? 'Đã là bạn' : 'Kết bạn'}
                      </button>
                      <button onClick={() => handleStartChat(result.id)} className="px-3 py-2.5 bg-surface-container text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-sm text-outline">Không tìm thấy người dùng phù hợp.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {friends.slice(0, 3).map((friend) => (
              <div key={friend.id} className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <div className="relative mb-4">
                  <img src={getAvatar(friend)} className="w-24 h-24 rounded-full object-cover" alt={getDisplayName(friend)} />
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <h3 className="font-bold text-lg">{getDisplayName(friend)}</h3>
                <p className="text-sm text-on-surface-variant mb-6 truncate w-full px-4">{friend.email || 'Đã kết bạn'}</p>
                <div className="w-full flex gap-2">
                  <button onClick={() => handleStartChat(friend.id)} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all">Nhắn tin</button>
                  <button onClick={() => handleStartChat(friend.id)} className="px-3 py-2.5 bg-surface-container text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
