import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock data
    setNotifications([
      { id: 1, type: 'FRIEND_REQUEST', sender: 'Linh Chi', time: '2 phút trước', read: false, avatar: 'https://i.pravatar.cc/150?u=chi', message: 'đã gửi lời mời kết bạn' },
      { id: 2, type: 'MESSAGE', sender: 'Nguyễn Minh Tú', time: '15 phút trước', read: true, avatar: 'https://i.pravatar.cc/150?u=tu', message: 'đã gửi tin nhắn cho bạn' },
      { id: 3, type: 'CALL', sender: 'Anh Duy', time: '1 giờ trước', read: true, avatar: 'https://i.pravatar.cc/150?u=duy', message: 'Cuộc gọi nhỡ' },
      { id: 4, type: 'SYSTEM', sender: 'Hệ thống', time: '3 giờ trước', read: true, icon: 'update', message: 'vừa cập nhật phiên bản mới 2.1.0' },
    ]);
  }, []);

  const filteredNotifs = filter === 'all' ? notifications : notifications.filter(n => n.type === filter.toUpperCase());

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex font-sans">
      {/* SIDE RAIL */}
      <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
        <div className="flex flex-col items-center w-full gap-4">
          <button onClick={() => navigate('/chat')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button onClick={() => navigate('/test-ui/friends')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">group</span>
          </button>
          <button className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="w-full flex flex-col items-center pb-4">
          <button onClick={() => navigate('/profile')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors rounded-full overflow-hidden">
            <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User")} />
          </button>
        </div>
      </aside>

      {/* NOTIFICATIONS SIDEBAR */}
      <div className="w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Thông báo</h1>
            <button className="text-[10px] text-primary font-bold hover:underline">Đọc hết</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'message', 'friend_request', 'call'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {f === 'all' ? 'Tất cả' : f === 'message' ? 'Tin nhắn' : f === 'friend_request' ? 'Kết bạn' : 'Cuộc gọi'}
              </button>
            ))}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {filteredNotifs.map(notif => (
            <div key={notif.id} className={`p-4 cursor-pointer hover:bg-surface-container-low transition-all border-b border-outline-variant/30 ${!notif.read ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  {notif.avatar ? (
                    <img src={notif.avatar} className="w-12 h-12 rounded-full object-cover" alt={notif.sender} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">{notif.icon}</span>
                    </div>
                  )}
                  {notif.type === 'FRIEND_REQUEST' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight text-on-surface">
                    <span className="font-bold">{notif.sender}</span> {notif.message}
                  </p>
                  <p className="text-[10px] text-outline mt-1">{notif.time}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL AREA */}
      <main className="flex-1 bg-surface-bright flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-surface-container-high mb-6 flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-primary opacity-30">notifications_active</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Chưa có nội dung xem chi tiết</h2>
          <p className="text-sm text-on-surface-variant px-8">Chọn một thông báo ở danh sách bên trái để xem chi tiết và thực hiện hành động.</p>
        </div>
      </main>
    </div>
  );
}
