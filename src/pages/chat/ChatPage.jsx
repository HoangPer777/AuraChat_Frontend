import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useFriendStore from '../../store/friendStore';
import api from '../../services/api';
import useIncomingCallNotifications from '../../hooks/useIncomingCallNotifications';
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications';
import useChatWebSocket from '../../hooks/useChatWebSocket';
import { saveCallSession } from '../../utils/callSession';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { conversations, setConversations, activeConversation, setActiveConversation, messages, setMessages, addMessage } = useChatStore();
  const { friends, loadFriends, isFriend } = useFriendStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useIncomingCallNotifications();
  useFriendRequestNotifications();
  useChatWebSocket();

  useEffect(() => {
    if (friends.length === 0) {
      loadFriends().catch(() => {})
    }
  }, [friends.length, loadFriends]);

  // Load user nếu chưa có (sau khi reload trang)
  useEffect(() => {
    if (!user) {
      api.get('/auth/me').then(res => {
        if (res.data?.success) setUser(res.data.data);
      }).catch(() => {});
    }
  }, [user, setUser]);

  // Load danh sách conversations
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

  // Load messages khi chọn conversation
  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/conversations/${activeConversation.id}/messages`);
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
      const response = await api.post(`/conversations/${activeConversation.id}/messages`, {
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

  const getConversationPeer = (conversation) => {
    if (!conversation) return null;

    if (conversation.receiverId && conversation.receiverId !== user?.id) {
      return {
        id: conversation.receiverId,
        name: conversation.receiverName || conversation.name,
        avatar: conversation.receiverAvatar || conversation.avatar,
      };
    }

    const peerMember = conversation.members?.find((member) => member.userId !== user?.id);
    if (peerMember) {
      return {
        id: peerMember.userId,
        name: peerMember.displayName || peerMember.name || `User ${peerMember.userId.slice(-6)}`,
        avatar: peerMember.avatarUrl || peerMember.avatar,
      };
    }

    return conversation.type === 'PRIVATE'
      ? {
          id: conversation.id,
          name: conversation.name,
          avatar: conversation.avatar,
        }
      : null;
  };

  const startVideoCall = () => {
    if (!activeConversation) return;

    const peer = getConversationPeer(activeConversation);
    if (!peer?.id) return;

    if (!isFriend(peer.id)) {
      window.alert('Chỉ có thể gọi sau khi hai bên đã kết bạn.')
      return
    }

    const callSession = {
      mode: 'outgoing',
      type: 'VIDEO',
      conversationId: activeConversation.id,
      receiverId: peer.id,
      receiverName: peer.name,
      receiverAvatar: peer.avatar,
    };

    saveCallSession(callSession);
    navigate('/test-ui/video-call', { state: callSession });
  };

  // Lấy tên hiển thị của conversation
  const getConvName = (conv) => {
    if (conv.name) return conv.name;
    if (conv.type === 'PRIVATE' && conv.members) {
      const other = conv.members.find(m => m.userId !== user?.id);
      // Backend giờ trả về displayName trong MemberDto
      return other?.displayName || (other ? `User ${other.userId.slice(-6)}` : 'Chat');
    }
    return 'Conversation';
  };

  // Lấy preview tin nhắn cuối
  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'Chưa có tin nhắn';
    if (typeof conv.lastMessage === 'string') return conv.lastMessage;
    return conv.lastMessage.content || 'Đã gửi một tin nhắn';
  };

  // Format thời gian
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface-container-low text-on-surface h-screen overflow-hidden flex font-sans">
      {/* SIDE RAIL */}
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
            <button onClick={() => navigate('/test-ui/notifications')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </nav>
        </div>
        <div className="w-full flex flex-col items-center pb-4">
          <button onClick={() => navigate('/profile')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors rounded-full overflow-hidden">
            <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover"
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}`} />
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
            <input className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all" placeholder="Tìm kiếm..." type="text" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-center text-sm text-outline py-8">Chưa có cuộc trò chuyện nào</p>
          )}
          {conversations.map((conv) => {
            const convName = getConvName(conv);
            const lastMsg = getLastMessagePreview(conv);
            const lastTime = formatTime(conv.lastMessage?.sentAt || conv.updatedAt);
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all ${activeConversation?.id === conv.id ? 'bg-surface-container border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <div className="relative shrink-0">
                  <img alt={convName} className="w-12 h-12 rounded-full object-cover"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(convName)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-on-surface truncate">{convName}</h3>
                    <span className="text-[11px] text-outline shrink-0 ml-1">{lastTime}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">{lastMsg}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 h-screen bg-surface-bright flex flex-col relative overflow-hidden">
        {activeConversation ? (
          <>
            <header className="h-16 flex justify-between items-center px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <img alt={getConvName(activeConversation)} className="w-10 h-10 rounded-full object-cover"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getConvName(activeConversation))}`} />
                <div>
                  <h2 className="font-bold text-on-surface">{getConvName(activeConversation)}</h2>
                  <p className="text-[10px] text-outline">
                    {activeConversation.type === 'GROUP' ? `${activeConversation.members?.length || 0} thành viên` : 'Chat cá nhân'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <button
                  onClick={startVideoCall}
                  disabled={!activeConversation || (getConversationPeer(activeConversation)?.id && !isFriend(getConversationPeer(activeConversation).id))}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Video call"
                >
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button
                  onClick={startVideoCall}
                  disabled={!activeConversation || (getConversationPeer(activeConversation)?.id && !isFriend(getConversationPeer(activeConversation).id))}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Video call"
                >
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest/30">
              {messages.length === 0 && (
                <p className="text-center text-sm text-outline py-8">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
              )}
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'flex-col items-end' : 'items-end gap-2'} max-w-[70%] ${isMe ? 'ml-auto' : ''}`}>
                    {!isMe && (
                      <img alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getConvName(activeConversation))}`} />
                    )}
                    <div className={`${isMe ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} p-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm`}>
                      {msg.content}
                      <span className={`block text-[10px] ${isMe ? 'text-white/70' : 'text-outline'} mt-1 text-right`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

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
            <div className="max-w-md text-center z-10 space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-container/10 mb-4">
                <span className="material-symbols-outlined text-primary text-[64px] opacity-40">forum</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Chào mừng bạn đến với AuraChat</h2>
              <p className="text-sm text-on-surface-variant px-12">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin ngay.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
