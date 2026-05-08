import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import api from '../../services/api';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation, setActiveConversation, messages, setMessages, addMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/conversations/${activeConversation.id}/messages`);
          if (response.data && response.data.success) {
            setMessages(response.data.data);
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      fetchMessages();
    }
  }, [activeConversation, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await api.post(`/api/conversations/${activeConversation.id}/messages`, {
        content: newMessage,
        type: 'TEXT'
      });
      if (response.data && response.data.success) {
        addMessage(response.data.data);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="bg-surface-container-low text-on-surface h-screen overflow-hidden flex font-sans">
      {/* SIDE RAIL NAVIGATION */}
      <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant w-[80px] items-center py-4 shrink-0">
        <div className="flex flex-col items-center w-full space-y-8">
          <div className="p-2 text-primary">
            <span className="material-symbols-outlined text-[32px]">waves</span>
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
          <button onClick={() => navigate('/profile')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors rounded-full overflow-hidden">
            <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User")} />
          </button>
        </div>
      </aside>

      {/* CONVERSATION LIST */}
      <div className="w-[320px] h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
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
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => setActiveConversation(conv)} 
              className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all ${activeConversation?.id === conv.id ? 'bg-surface-container border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
            >
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
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 h-screen bg-surface-bright flex flex-col relative overflow-hidden">
        {activeConversation ? (
          <>
            {/* CHAT HEADER */}
            <header className="h-16 flex justify-between items-center px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img alt={activeConversation.name} className="w-10 h-10 rounded-full object-cover" src={activeConversation.avatar || "https://ui-avatars.com/api/?name=" + activeConversation.name} />
                  {activeConversation.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div>
                  <h2 className="font-bold text-on-surface">{activeConversation.name}</h2>
                  <p className="text-[10px] text-green-600 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 ${activeConversation.isOnline ? 'bg-green-500' : 'bg-outline'} rounded-full`}></span>
                    {activeConversation.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <button onClick={() => navigate('/test-ui/audio-call')} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button onClick={() => navigate('/test-ui/video-call')} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest/30">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'flex-col items-end' : 'items-end gap-2'} max-w-[70%] ${isMe ? 'ml-auto' : ''}`}>
                    {!isMe && (
                      <img alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" src={activeConversation.avatar || "https://ui-avatars.com/api/?name=" + activeConversation.name} />
                    )}
                    <div className={`${isMe ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} p-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm`}>
                      {msg.content}
                      <span className={`block text-[10px] ${isMe ? 'text-white/70' : 'text-outline'} mt-1 text-right`}>{msg.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <footer className="p-4 bg-surface shrink-0">
              <form onSubmit={handleSendMessage} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-center gap-1 px-2">
                  <button type="button" className="p-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <button type="button" className="p-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">image</span>
                  </button>
                </div>
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3" 
                  placeholder="Nhập tin nhắn..." 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <div className="flex items-center gap-1 px-2">
                  <button type="button" className="p-2 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                  </button>
                  <button type="submit" className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg hover:opacity-90 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
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
          </div>
        )}
      </div>
    </div>
  );
}

