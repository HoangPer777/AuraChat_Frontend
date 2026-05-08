import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import api from '../../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, setConversations, setActiveConversation } = useChatStore();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/api/conversations');
        if (response.data && response.data.success) {
          setConversations(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
  }, [setConversations]);

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    navigate('/test-ui/chat');
  };

  return (
    <div className="bg-surface-container-low text-on-surface h-screen overflow-hidden flex">
      {/* SIDE RAIL NAVIGATION */}
      <aside className="z-50 flex flex-col justify-between h-screen overflow-y-auto bg-surface-container-low fixed left-0 top-0 h-full w-[80px] items-center py-4 border-r border-outline-variant">
        <div className="flex flex-col items-center w-full space-y-8">
          <div className="p-2">
            <span className="material-symbols-outlined text-primary text-[32px]">waves</span>
          </div>
          <nav className="flex flex-col items-center w-full gap-4">
            <button className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">chat</span>
            </button>
            <button onClick={() => navigate('/test-ui/friends')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">group</span>
            </button>
            <div className="relative w-full flex justify-center">
              <button onClick={() => navigate('/test-ui/notifications')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <span className="absolute top-3 right-5 bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-surface-container-low">5</span>
            </div>
            <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </nav>
        </div>
        <div className="w-full flex flex-col items-center pb-4">
          <button onClick={() => navigate('/test-ui/profile-new')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors rounded-full overflow-hidden">
            <img alt="User Profile" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User")} />
          </button>
        </div>
      </aside>

      {/* CONVERSATION LIST */}
      <main className="ml-[80px] w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-on-surface">Tin nhắn</h1>
          <button onClick={() => navigate('/test-ui/create-group')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-primary hover:bg-primary-container hover:text-white transition-all">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        </header>
        <div className="px-4 pb-4">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">search</span>
            <input className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all" placeholder="Tìm kiếm cuộc trò chuyện..." type="text" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div key={conv.id} onClick={() => handleConversationClick(conv)} className="p-3 flex items-center gap-3 hover:bg-surface-container-low cursor-pointer rounded-xl transition-all">
                <div className="relative shrink-0">
                  <img alt={conv.name} className="w-12 h-12 rounded-full object-cover" src={conv.avatar || "https://ui-avatars.com/api/?name=" + conv.name} />
                  {conv.isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-container rounded-full"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-on-surface truncate">{conv.name}</h3>
                    <span className="text-[11px] text-outline">{conv.lastMessageTime}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-on-surface-variant truncate">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && <span className="bg-primary text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{conv.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-outline py-8 text-sm">Chưa có hội thoại nào</p>
          )}
        </div>
      </main>

      {/* WELCOME AREA */}
      <section className="flex-1 h-screen bg-surface-bright flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-5%] left-[5%] w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="max-w-md text-center z-10 space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-container/10 mb-4">
            <span className="material-symbols-outlined text-primary text-[64px] opacity-40">forum</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Chào mừng bạn đến với AuraChat</h2>
          <p className="text-sm text-on-surface-variant px-12">
            Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin ngay. Trải nghiệm giao tiếp thông minh và bảo mật.
          </p>
          <div className="pt-4">
            <button onClick={() => navigate('/test-ui/create-group')} className="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all">
              Bắt đầu hội thoại mới
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-[12px] text-on-surface-variant">Hệ thống đang hoạt động</span>
        </div>
      </section>
    </div>
  );
}

