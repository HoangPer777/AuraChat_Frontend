import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useFriendStore from '../../store/friendStore';
import api from '../../services/api';
import useIncomingCallNotifications from '../../hooks/useIncomingCallNotifications';
import useFriendRequestNotifications from '../../hooks/useFriendRequestNotifications';
import { saveCallSession } from '../../utils/callSession';

export default function ChatWindowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation, setActiveConversation, messages, setMessages, addMessage } = useChatStore();
  const { friends, loadFriends, isFriend } = useFriendStore();
  const [newMessage, setNewMessage] = useState('');
  const [isResolvingConversation, setIsResolvingConversation] = useState(true);
  const messagesEndRef = useRef(null);

  const friendId = searchParams.get('friendId') || location.state?.friendId || null;

  const getConversationPeerId = (conversation) => {
    if (!conversation) return null;

    if (conversation.receiverId && conversation.receiverId !== user?.id) {
      return conversation.receiverId;
    }

    const peerMember = conversation.members?.find((member) => member.userId !== user?.id);
    if (peerMember?.userId) {
      return peerMember.userId;
    }

    return null;
  };

  const findPrivateConversationByFriendId = (conversationList, targetFriendId) =>
    conversationList.find((conversation) => {
      if (!conversation || conversation.type !== 'PRIVATE') return false;

      if (conversation.receiverId === targetFriendId) return true;

      const peerId = getConversationPeerId(conversation);
      if (peerId === targetFriendId) return true;

      return conversation.id === targetFriendId;
    }) || null;

  useIncomingCallNotifications();
  useFriendRequestNotifications();

  useEffect(() => {
    if (friends.length === 0) {
      loadFriends().catch(() => {})
    }
  }, [friends.length, loadFriends]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;

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
  }, [activeConversation, setMessages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/conversations');
        if (response.data && response.data.success) {
          setConversations(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setIsResolvingConversation(false);
      }
    };

    fetchConversations();
  }, [setConversations]);

  useEffect(() => {
    if (!friendId) {
      return;
    }

    const activePeerId = getConversationPeerId(activeConversation);
    if (activePeerId === friendId) {
      return;
    }

    const matchedConversation = findPrivateConversationByFriendId(conversations, friendId);
    if (matchedConversation && matchedConversation.id !== activeConversation?.id) {
      setActiveConversation(matchedConversation);
    }
  }, [activeConversation, conversations, friendId, setActiveConversation]);

  useEffect(() => {
    if (!isResolvingConversation && !activeConversation) {
      navigate('/test-ui/home');
    }
  }, [activeConversation, isResolvingConversation, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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

  if (!activeConversation) return null;

  return (
    <div className="bg-surface font-sans text-on-surface overflow-hidden h-screen flex">
      {/* SIDEBAR NAVIGATION (Rail) */}
      <aside className="z-50 flex flex-col justify-between h-screen bg-surface-container-low border-r border-outline-variant fixed left-0 top-0 w-[80px] py-4 items-center">
        <div className="flex flex-col items-center gap-8 w-full">
          <div onClick={() => navigate('/test-ui/home')} className="text-primary cursor-pointer">
            <span className="material-symbols-outlined text-4xl">bubble_chart</span>
          </div>
          <nav className="flex flex-col items-center w-full">
            <button onClick={() => navigate('/test-ui/home')} className="text-primary border-l-4 border-primary w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
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
        <div className="flex flex-col items-center w-full">
          <button onClick={() => navigate('/test-ui/profile-new')} className="text-on-surface-variant w-full flex justify-center py-4 hover:bg-surface-container-high transition-colors">
             <img alt="User" className="w-10 h-10 rounded-full border-2 border-outline-variant object-cover" src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.displayName || "User")} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-[80px] flex w-full h-full">
        {/* CHAT WINDOW */}
        <section className="flex-1 flex flex-col bg-surface overflow-hidden">
          {/* HEADER */}
          <header className="h-16 flex justify-between items-center px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img alt={activeConversation.name} className="w-10 h-10 rounded-full object-cover" src={activeConversation.avatar || "https://ui-avatars.com/api/?name=" + activeConversation.name} />
                {activeConversation.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
              </div>
              <div>
                <h2 className="font-bold text-on-surface">{activeConversation.name}</h2>
                <p className={`text-[10px] ${activeConversation.isOnline ? 'text-green-600' : 'text-outline'} flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 ${activeConversation.isOnline ? 'bg-green-500' : 'bg-outline'} rounded-full`}></span>
                  {activeConversation.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant">
                <button
                  onClick={startVideoCall}
                  disabled={getConversationPeer(activeConversation)?.id && !isFriend(getConversationPeer(activeConversation).id)}
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Video call"
                >
                <span className="material-symbols-outlined">call</span>
              </button>
                <button
                  onClick={startVideoCall}
                  disabled={getConversationPeer(activeConversation)?.id && !isFriend(getConversationPeer(activeConversation).id)}
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

          {/* MESSAGES AREA */}
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

          {/* INPUT BAR */}
          <footer className="p-4 bg-surface">
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
        </section>
      </main>
    </div>
  );
}

