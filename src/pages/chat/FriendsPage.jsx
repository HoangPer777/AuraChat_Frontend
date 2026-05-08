import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real app, fetch from /api/friends
    setFriends([
      { id: 1, name: 'Linh Nguyễn', avatar: 'https://i.pravatar.cc/150?u=linh', status: 'Online', bio: 'UI/UX Designer' },
      { id: 2, name: 'Hoàng Anh', avatar: 'https://i.pravatar.cc/150?u=hoang', status: 'Offline', bio: 'Developer' },
      { id: 3, name: 'Minh Tuấn', avatar: 'https://i.pravatar.cc/150?u=tuan', status: 'Online', bio: 'Marketing' },
    ]);
    setRequests([
      { id: 4, name: 'Linh Chi', avatar: 'https://i.pravatar.cc/150?u=chi', mutual: 12, bio: 'Product Designer' },
    ]);
  }, []);

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-surface-bright text-on-surface h-screen overflow-hidden flex font-sans">
      {/* SIDE RAIL */}
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
            <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User")} />
          </button>
        </div>
      </aside>

      {/* CONTACTS SIDEBAR */}
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
            Lời mời {requests.length > 0 && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'friends' ? (
            filteredFriends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                <div className="relative shrink-0">
                  <img src={friend.avatar} className="w-12 h-12 rounded-full object-cover" alt={friend.name} />
                  {friend.status === 'Online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{friend.name}</p>
                  <p className="text-[11px] text-outline truncate">{friend.status}</p>
                </div>
                <button onClick={() => navigate('/chat')} className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors">
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </div>
            ))
          ) : (
            requests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                <img src={req.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt={req.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{req.name}</p>
                  <p className="text-[11px] text-outline truncate">{req.mutual} bạn chung</p>
                </div>
                <div className="flex gap-1">
                  <button className="text-primary p-2 hover:bg-primary/10 rounded-full"><span className="material-symbols-outlined">check_circle</span></button>
                  <button className="text-error p-2 hover:bg-error/10 rounded-full"><span className="material-symbols-outlined">cancel</span></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-surface-bright p-10 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gợi ý bạn bè</h2>
          <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all">
            <span className="material-symbols-outlined">person_add</span>
            Thêm bạn mới
          </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-surface-container-high"></div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <h3 className="font-bold text-lg">Người dùng {i}</h3>
              <p className="text-sm text-on-surface-variant mb-6 truncate w-full px-4">UI/UX Designer at AuraChat</p>
              <div className="w-full flex gap-2">
                <button className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all">Nhắn tin</button>
                <button className="px-3 py-2.5 bg-surface-container text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
