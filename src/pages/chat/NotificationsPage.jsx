import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useFriendStore from '../../store/friendStore';
import useNotificationStore from '../../store/notificationStore';
import useChatStore from '../../store/chatStore';
import NotificationPermissionBanner from '../../components/notifications/NotificationPermissionBanner';
import { formatTimeAgo } from '../../utils/browserNotification';

const TYPE_LABELS = {
  all: 'Tất cả',
  message: 'Tin nhắn',
  friend_request: 'Kết bạn',
  call: 'Cuộc gọi',
  system: 'Hệ thống',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const { pendingRequests, loadPendingRequests, acceptRequest, declineRequest } = useFriendStore();
  const {
    items,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const conversations = useChatStore((s) => s.conversations);

  useEffect(() => {
    loadPendingRequests().catch(() => {});
  }, [loadPendingRequests]);

  const notifications = useMemo(() => {
    const friendNotifications = pendingRequests.map((request) => ({
      id: `friend-${request.id}`,
      type: 'FRIEND_REQUEST',
      title: request.sender?.displayName || 'Lời mời kết bạn',
      message: 'đã gửi lời mời kết bạn',
      createdAt: request.createdAt,
      read: false,
      avatar: request.sender?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender?.displayName || 'User')}`,
      requestId: request.id,
      route: '/notifications',
    }));

    const merged = [...friendNotifications];
    items.forEach((item) => {
      if (!merged.some((entry) => entry.id === item.id)) {
        merged.push(item);
      }
    });

    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, pendingRequests]);

  const filteredNotifs = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter.toUpperCase());

  const selected = filteredNotifs.find((item) => item.id === selectedId) || filteredNotifs[0] || null;

  const handleOpen = (notif) => {
    setSelectedId(notif.id);
    markAsRead(notif.id);

    if (notif.type === 'MESSAGE' && notif.conversationId) {
      const conversation = conversations.find((item) => item.id === notif.conversationId);
      if (conversation) setActiveConversation(conversation);
      navigate('/chat/window');
      return;
    }

    if (notif.type === 'CALL') {
      navigate('/call/incoming');
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex flex-1 font-sans">
      <div className="w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Thông báo</h1>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  Đọc hết
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] text-outline font-bold hover:underline"
                >
                  Xóa hết
                </button>
              )}
            </div>
          </div>
          <NotificationPermissionBanner />
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mt-4">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${filter === key ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {filteredNotifs.length === 0 ? (
            <p className="text-center text-outline text-sm py-12 px-4">Chưa có thông báo nào</p>
          ) : (
            filteredNotifs.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleOpen(notif)}
                className={`w-full text-left p-4 hover:bg-surface-container-low transition-all border-b border-outline-variant/30 ${!notif.read ? 'bg-primary/5 border-l-4 border-primary' : ''} ${selected?.id === notif.id ? 'bg-surface-container-low' : ''}`}
              >
                <div className="flex gap-3 items-center">
                  <div className="relative shrink-0">
                    {notif.avatar ? (
                      <img src={notif.avatar} className="w-12 h-12 rounded-full object-cover" alt={notif.title} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">
                          {notif.type === 'CALL' ? 'call' : notif.type === 'MESSAGE' ? 'chat' : 'notifications'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight text-on-surface">
                      <span className="font-bold">{notif.title}</span> {notif.message}
                    </p>
                    <p className="text-[10px] text-outline mt-1">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <main className="flex-1 bg-surface-bright flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        {selected ? (
          <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              {selected.avatar ? (
                <img src={selected.avatar} alt={selected.title} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">notifications</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <p className="text-sm text-outline">{formatTimeAgo(selected.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">{selected.message}</p>

            {selected.type === 'FRIEND_REQUEST' && selected.requestId && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => acceptRequest(selected.requestId).then(() => removeNotification(selected.id))}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm"
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  onClick={() => declineRequest(selected.requestId).then(() => removeNotification(selected.id))}
                  className="flex-1 py-3 rounded-xl border border-error text-error font-bold text-sm"
                >
                  Từ chối
                </button>
              </div>
            )}

            {selected.type === 'MESSAGE' && (
              <button
                type="button"
                onClick={() => handleOpen(selected)}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm"
              >
                Mở cuộc trò chuyện
              </button>
            )}

            {selected.type === 'CALL' && (
              <button
                type="button"
                onClick={() => navigate('/call/incoming')}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm"
              >
                Xem cuộc gọi
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-surface-container-high mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-primary opacity-30">notifications_active</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Chưa có thông báo</h2>
            <p className="text-sm text-on-surface-variant px-8">
              Bật thông báo trình duyệt để nhận tin nhắn, lời mời kết bạn và cuộc gọi khi bạn không ở tab chat.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
