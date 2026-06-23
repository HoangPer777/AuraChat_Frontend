import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useFriendStore from '../../store/friendStore';
import api from '../../services/api';
import { startOutgoingVideoCall, startOutgoingAudioCall } from '../../utils/callHelpers';
import OnlineIndicator from '../../components/user/OnlineIndicator';
import { formatCallLogText } from '../../utils/callLogMessage';
import {
  getConversationAvatar,
  getConversationDisplayName,
  resolveSenderInfo,
} from '../../utils/conversationHelpers';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, setConversations, setActiveConversation } = useChatStore();
  const { loadFriends, isFriend } = useFriendStore();

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
    loadFriends().catch(() => {});
  }, [setConversations, loadFriends]);

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    navigate('/chat/window');
  };

  // Lấy tên hiển thị của conversation
  const getConvName = (conv) => getConversationDisplayName(conv, user?.id);

  // Lấy avatar của conversation
  const getConvAvatar = (conv) => getConversationAvatar(conv, user?.id);

  // Lấy preview tin nhắn cuối
  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'Chưa có tin nhắn';
    if (conv.lastMessage.type === 'CALL_LOG') {
      return formatCallLogText(conv.lastMessage.content);
    }
    if (conv.lastMessage.type === 'VOICE') {
      return 'Tin nhắn thoại';
    }
    if (conv.lastMessage.type === 'IMAGE') {
      return 'Đã gửi một hình ảnh';
    }
    if (conv.lastMessage.type === 'STICKER') {
      return 'Sticker';
    }
    if (conv.lastMessage.type === 'FILE') {
      return 'Đã gửi một tệp';
    }

    if (conv.type === 'GROUP' && conv.lastMessage.senderId && conv.lastMessage.senderId !== user?.id) {
      const sender = conv.members?.find((member) => member.userId === conv.lastMessage.senderId);
      const senderName = sender?.displayName;
      const content = conv.lastMessage.content || 'Đã gửi một tin nhắn';
      if (senderName) {
        return `${senderName}: ${content}`;
      }
    }

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

  const getConvPeer = (conv) => {
    if (conv.type !== 'PRIVATE') return null;
    const other = conv.members?.find(m => m.userId !== user?.id);
    if (!other) return null;
    return {
      id: other.userId,
      name: other.displayName || `User ${other.userId.slice(-6)}`,
      avatar: other.avatarUrl,
    };
  };

  const handlePeerCall = (event, conv, callType) => {
    event.stopPropagation();
    const peer = getConvPeer(conv);
    if (!peer?.id) return;

    if (!isFriend(peer.id)) {
      window.alert('Chỉ có thể gọi sau khi hai bên đã kết bạn.');
      return;
    }

    const params = {
      conversationId: conv.id,
      receiverId: peer.id,
      receiverName: peer.name,
      receiverAvatar: peer.avatar,
    };

    if (callType === 'AUDIO') {
      startOutgoingAudioCall(navigate, params);
      return;
    }

    startOutgoingVideoCall(navigate, params);
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
              const canCall = conv.type === 'PRIVATE' && peerId && isFriend(peerId);
              const isGroup = conv.type === 'GROUP';
              const memberCount = conv.members?.length || 0;
              return (
                <div key={conv.id} onClick={() => handleConversationClick(conv)} className="p-3 flex items-center gap-3 hover:bg-surface-container-low cursor-pointer rounded-xl transition-all group">
                  <div className="relative shrink-0">
                    <img alt={convName} className="w-12 h-12 rounded-full object-cover" src={convAvatar} />
                    {isGroup ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center border-2 border-surface-container">
                        <span className="material-symbols-outlined text-[12px]">groups</span>
                      </span>
                    ) : (
                      <OnlineIndicator
                        userId={peerId}
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface-container rounded-full"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-on-surface truncate">{convName}</h3>
                      <span className="text-[11px] text-outline">{lastTime}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5 gap-2">
                      <p className="text-xs text-on-surface-variant truncate">{lastMsg}</p>
                      {isGroup && (
                        <span className="text-[10px] text-outline shrink-0">{memberCount} TV</span>
                      )}
                    </div>
                  </div>
                  {canCall && (
                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={(event) => handlePeerCall(event, conv, 'AUDIO')}
                        className="p-2 rounded-full text-primary hover:bg-primary-container/20 transition-all"
                        aria-label="Gọi thoại"
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handlePeerCall(event, conv, 'VIDEO')}
                        className="p-2 rounded-full text-primary hover:bg-primary-container/20 transition-all"
                        aria-label="Gọi video"
                      >
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                      </button>
                    </div>
                  )}
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

