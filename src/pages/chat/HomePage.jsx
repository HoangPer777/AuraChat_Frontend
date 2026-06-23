import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import api from '../../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, setConversations, setActiveConversation, isOnline } = useChatStore();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/conversations');
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
    navigate('/chat/window');
  };

  // Lấy tên hiển thị của conversation
  const getConvName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.type === 'PRIVATE' && conv.members) {
      const other = conv.members.find(m => m.userId !== user?.id);
      return other?.displayName || (other ? `User ${other.userId.slice(-6)}` : 'Chat');
    }
    return 'Conversation';
  };

  // Lấy avatar của conversation
  const getConvAvatar = (conv) => {
    if (conv.avatarUrl) return conv.avatarUrl;
    if (conv.type === 'PRIVATE' && conv.members) {
      const other = conv.members.find(m => m.userId !== user?.id);
      if (other?.avatarUrl) return other.avatarUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getConvName(conv))}`;
  };

  // Lấy preview tin nhắn cuối
  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'Chưa có tin nhắn';
    return conv.lastMessage.content || 'Đã gửi một tin nhắn';
  };

  // Format thời gian
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Lấy peerId của PRIVATE conversation để check online status
  const getConvPeerId = (conv) => {
    if (conv.type !== 'PRIVATE') return null;
    const other = conv.members?.find(m => m.userId !== user?.id);
    return other?.userId || null;
  };

  return (
    <div className="h-screen overflow-hidden flex flex-1">
      {/* CONVERSATION LIST */}
      <main className="w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
        <header className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-on-surface">Tin nhắn</h1>
          <button onClick={() => navigate('/create-group')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-primary hover:bg-primary-container hover:text-white transition-all">
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
            conversations.map((conv) => {
              const convName = getConvName(conv);
              const convAvatar = getConvAvatar(conv);
              const lastMsg = getLastMessagePreview(conv);
              const lastTime = formatTime(conv.lastMessage?.sentAt || conv.updatedAt);
              const peerId = getConvPeerId(conv);
              const peerOnline = peerId ? isOnline(peerId) : false;
              return (
                <div key={conv.id} onClick={() => handleConversationClick(conv)} className="p-3 flex items-center gap-3 hover:bg-surface-container-low cursor-pointer rounded-xl transition-all">
                  <div className="relative shrink-0">
                    <img alt={convName} className="w-12 h-12 rounded-full object-cover" src={convAvatar} />
                    {peerOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-container rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-on-surface truncate">{convName}</h3>
                      <span className="text-[11px] text-outline">{lastTime}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-on-surface-variant truncate">{lastMsg}</p>
                    </div>
                  </div>
                </div>
              );
            })
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
            <button onClick={() => navigate('/create-group')} className="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all">
              Bắt đầu hội thoại mới
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

