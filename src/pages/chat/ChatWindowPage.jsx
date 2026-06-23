import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useFriendStore from '../../store/friendStore';
import api from '../../services/api';
import { createPrivateConversation } from '../../services/friendService';
import { uploadFile, uploadImage } from '../../services/mediaService';
import { saveCallSession } from '../../utils/callSession';

export default function ChatWindowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation, setActiveConversation, messages, setMessages, addMessage } = useChatStore();
  const { friends, loadFriends, isFriend } = useFriendStore();
  const [newMessage, setNewMessage] = useState('');
  const [uploadingType, setUploadingType] = useState(null);
  const [isResolvingConversation, setIsResolvingConversation] = useState(true);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

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
      return;
    }

    // Conversation not found, try to create one
    if (!matchedConversation && friendId) {
      const createConversation = async () => {
        try {
          const response = await createPrivateConversation(friendId);
          if (response?.success && response?.data) {
            setActiveConversation(response.data);
          }
        } catch (err) {
          // Backend endpoint not found, create mock conversation object
          console.log('Creating mock conversation for friendId:', friendId);
          
          const friend = friends.find(f => f.id === friendId);
          const mockConversation = {
            id: `temp_${friendId}`,
            type: 'PRIVATE',
            receiverId: friendId,
            receiverName: friend?.displayName || `User ${friendId.slice(-6)}`,
            receiverAvatar: friend?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend?.displayName || 'User')}`,
            name: friend?.displayName || `User ${friendId.slice(-6)}`,
            avatar: friend?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend?.displayName || 'User')}`,
            members: [],
            lastMessage: null,
            isOnline: false,
          };
          setActiveConversation(mockConversation);
        }
      };
      
      createConversation();
    }
  }, [activeConversation, conversations, friendId, setActiveConversation, friends]);

  useEffect(() => {
    if (!isResolvingConversation && !activeConversation) {
      navigate('/chat');
    }
  }, [activeConversation, isResolvingConversation, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let conversationId = activeConversation?.id;

    // If conversation is temporary (mock), try to create it first
    if (conversationId?.startsWith('temp_')) {
      try {
        const response = await createPrivateConversation(activeConversation.receiverId);
        if (response?.success && response?.data?.id) {
          conversationId = response.data.id;
          setActiveConversation(response.data);
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
        window.alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
        return;
      }
    }

    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
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

  const handleAttachMedia = async (event, mediaType) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !activeConversation) return

    let conversationId = activeConversation.id
    if (conversationId?.startsWith('temp_')) {
      try {
        const response = await createPrivateConversation(activeConversation.receiverId)
        if (response?.success && response?.data?.id) {
          conversationId = response.data.id
          setActiveConversation(response.data)
        }
      } catch (err) {
        console.error('Failed to create conversation before attachment upload:', err)
        window.alert('Khong the tao cuoc tro chuyen de gui tep.')
        return
      }
    }

    setUploadingType(mediaType)
    try {
      const uploadResponse = mediaType === 'IMAGE'
        ? await uploadImage(file)
        : await uploadFile(file)

      if (!uploadResponse?.success || !uploadResponse?.data?.url) {
        window.alert(uploadResponse?.message || 'Tai media that bai.')
        return
      }

      const payload = uploadResponse.data
      const sendPayload = {
        content: mediaType === 'IMAGE' ? (file.name || 'Image') : `Tep: ${payload.originalFileName || file.name}`,
        type: mediaType,
        fileUrl: payload.url,
        fileName: payload.originalFileName || payload.fileName || file.name,
        fileSize: payload.size || file.size,
      }

      const messageResponse = await api.post(`/conversations/${conversationId}/messages`, sendPayload)
      if (messageResponse.data?.success) {
        addMessage(messageResponse.data.data)
      }
    } catch (err) {
      console.error('Error uploading/sending media message:', err)
      window.alert(err.response?.data?.message || 'Khong the gui media. Vui long thu lai.')
    } finally {
      setUploadingType(null)
    }
  }

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
    navigate('/call/video', { state: callSession });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeConversation) return null;

  return (
    <div className="bg-surface font-sans text-on-surface overflow-hidden h-screen flex flex-1">
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
                  <div className={`${isMe ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} p-3 rounded-2xl ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm max-w-full`}>
                    {msg.type === 'IMAGE' && msg.fileUrl ? (
                      <div className="space-y-2">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || 'Image message'}
                          className="max-h-56 max-w-full rounded-xl object-cover border border-white/10"
                        />
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                      </div>
                    ) : msg.type === 'FILE' && msg.fileUrl ? (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 underline ${isMe ? 'text-white' : 'text-primary'}`}
                      >
                        <span className="material-symbols-outlined text-base">description</span>
                        {msg.fileName || msg.content || 'Mo tep'}
                      </a>
                    ) : (
                      msg.content
                    )}
                    <span className={`block text-[10px] ${isMe ? 'text-white/70' : 'text-outline'} mt-1 text-right`}>{formatTime(msg.createdAt || msg.sentAt)}</span>
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
                <button
                  type="button"
                  className="p-2 text-outline hover:text-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingType !== null}
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button
                  type="button"
                  className="p-2 text-outline hover:text-primary transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingType !== null}
                >
                  <span className="material-symbols-outlined">image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt"
                  onChange={(event) => handleAttachMedia(event, 'FILE')}
                  className="hidden"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAttachMedia(event, 'IMAGE')}
                  className="hidden"
                />
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3" 
                placeholder={uploadingType ? 'Dang tai media...' : 'Nhập tin nhắn...'} 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={uploadingType !== null}
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
    </div>
  );
}

