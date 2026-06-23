import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import useFriendStore from '../../store/friendStore';
import api from '../../services/api';
import { createPrivateConversation } from '../../services/friendService';
import { getConversation } from '../../services/conversationService';
import { uploadFile, uploadImage, uploadAudio } from '../../services/mediaService';
import { startOutgoingVideoCall, startOutgoingAudioCall } from '../../utils/callHelpers';
import OnlineIndicator from '../../components/user/OnlineIndicator';
import { formatCallLogText } from '../../utils/callLogMessage';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { buildVoiceFile } from '../../utils/voiceMessage';
import StickerPicker from '../../components/chat/StickerPicker';
import { findStickerById } from '../../utils/stickers';
import GroupInfoModal from '../../components/chat/GroupInfoModal';
import {
  getConversationAvatar,
  getConversationDisplayName,
  resolveSenderInfo,
} from '../../utils/conversationHelpers';

export default function ChatWindowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversation, setActiveConversation, messages, setMessages, addMessage, upsertConversation, removeConversation } = useChatStore();
  const { friends, loadFriends, isFriend } = useFriendStore();
  const [newMessage, setNewMessage] = useState('');
  const [uploadingType, setUploadingType] = useState(null);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isResolvingConversation, setIsResolvingConversation] = useState(true);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    isRecording,
    durationSec,
    error: voiceError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: clearVoiceError,
  } = useVoiceRecorder();

  const friendId = searchParams.get('friendId') || location.state?.friendId || null;
  const conversationIdParam = searchParams.get('conversationId') || location.state?.conversationId || null;
  const callNotice = location.state?.callNotice || null;

  const isGroupChat = activeConversation?.type === 'GROUP';
  const conversationTitle = getConversationDisplayName(activeConversation, user?.id);
  const conversationAvatar = getConversationAvatar(activeConversation, user?.id);
  const memberCount = activeConversation?.members?.length || 0;

  const getConversationPeerId = (conversation) => {
    if (!conversation || conversation.type === 'GROUP') return null;

    if (conversation.receiverId && conversation.receiverId !== user?.id) {
      return conversation.receiverId;
    }

    const peerMember = conversation.members?.find((member) => member.userId !== user?.id);
    if (peerMember?.userId) {
      return peerMember.userId;
    }

    return null;
  };

  const activePeerId = getConversationPeerId(activeConversation);
  const peerOnline = useChatStore((state) => Boolean(activePeerId && state.onlineByUserId[activePeerId]));

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
    if (!conversationIdParam) return;

    if (activeConversation?.id === conversationIdParam) return;

    const matchedConversation = conversations.find((conversation) => conversation.id === conversationIdParam);
    if (matchedConversation) {
      setActiveConversation(matchedConversation);
      return;
    }

    const loadConversation = async () => {
      try {
        const response = await getConversation(conversationIdParam);
        if (response?.success && response?.data) {
          upsertConversation(response.data);
          setActiveConversation(response.data);
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
      }
    };

    loadConversation();
  }, [activeConversation?.id, conversationIdParam, conversations, setActiveConversation, upsertConversation]);

  useEffect(() => {
    if (!friendId || isGroupChat) {
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
  }, [activeConversation, conversations, friendId, isGroupChat, setActiveConversation, friends]);

  useEffect(() => {
    if (!isResolvingConversation && !activeConversation) {
      navigate('/chat');
    }
  }, [activeConversation, isResolvingConversation, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!callNotice) return undefined

    if (callNotice === 'busy') {
      window.alert('Bên kia đang bận hoặc không thể nhận cuộc gọi lúc này.')
    }

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        friendId: location.state?.friendId || friendId,
        callNotice: null,
      },
    })

    return undefined
  }, [callNotice, location.pathname, location.search, location.state, navigate, friendId]);

  useEffect(() => {
    if (!voiceError) return undefined
    window.alert(voiceError)
    clearVoiceError()
    return undefined
  }, [voiceError, clearVoiceError]);

  const ensureConversationId = async () => {
    let conversationId = activeConversation?.id
    if (!conversationId) return null

    if (conversationId.startsWith('temp_')) {
      try {
        const response = await createPrivateConversation(activeConversation.receiverId)
        if (response?.success && response?.data?.id) {
          conversationId = response.data.id
          setActiveConversation(response.data)
        }
      } catch (err) {
        console.error('Failed to create conversation:', err)
        window.alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
        return null
      }
    }

    return conversationId
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const conversationId = await ensureConversationId();
    if (!conversationId) return;

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

    const conversationId = await ensureConversationId()
    if (!conversationId) return

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
        content: mediaType === 'IMAGE' ? '' : `Tep: ${payload.originalFileName || file.name}`,
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

  const sendVoiceMessage = async (recording) => {
    if (!activeConversation || !recording?.blob) return

    const conversationId = await ensureConversationId()
    if (!conversationId) return

    const voiceFile = buildVoiceFile(recording)

    setUploadingType('VOICE')
    try {
      const uploadResponse = await uploadAudio(voiceFile)
      if (!uploadResponse?.success || !uploadResponse?.data?.url) {
        window.alert(uploadResponse?.message || 'Tải tin nhắn thoại thất bại.')
        return
      }

      const payload = uploadResponse.data
      const messageResponse = await api.post(`/conversations/${conversationId}/messages`, {
        content: '',
        type: 'VOICE',
        fileUrl: payload.url,
        fileName: payload.originalFileName || payload.fileName || voiceFile.name,
        fileSize: payload.size || voiceFile.size,
      })

      if (messageResponse.data?.success) {
        addMessage(messageResponse.data.data)
      }
    } catch (err) {
      console.error('Error sending voice message:', err)
      window.alert(err.response?.data?.message || 'Không thể gửi tin nhắn thoại.')
    } finally {
      setUploadingType(null)
    }
  }

  const handleSendSticker = async (sticker) => {
    if (!sticker || !activeConversation) return

    const conversationId = await ensureConversationId()
    if (!conversationId) return

    setStickerPickerOpen(false)
    setUploadingType('STICKER')
    try {
      const messageResponse = await api.post(`/conversations/${conversationId}/messages`, {
        content: sticker.id,
        type: 'STICKER',
        fileUrl: sticker.url,
      })

      if (messageResponse.data?.success) {
        addMessage(messageResponse.data.data)
      }
    } catch (err) {
      console.error('Error sending sticker:', err)
      window.alert(err.response?.data?.message || 'Không thể gửi sticker.')
    } finally {
      setUploadingType(null)
    }
  }

  const handleVoiceToggle = async () => {
    if (uploadingType) return

    if (isRecording) {
      try {
        const recording = await stopRecording()
        await sendVoiceMessage(recording)
      } catch (err) {
        if (err?.message !== 'Bản ghi âm quá ngắn.') {
          window.alert(err.message || 'Không thể gửi tin nhắn thoại.')
        }
        cancelRecording()
      }
      return
    }

    await startRecording()
  }

  const formatVoiceDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getConversationPeer = (conversation) => {
    if (!conversation || conversation.type === 'GROUP') return null;

    const peerId = getConversationPeerId(conversation)
    if (!peerId) return null

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

    return {
      id: peerId,
      name: conversation.name,
      avatar: conversation.avatar,
    };
  };

  const conversationPeer = getConversationPeer(activeConversation);
  const canCallPeer = !isGroupChat && Boolean(conversationPeer?.id && isFriend(conversationPeer.id));

  const getMessageSenderInfo = (senderId) =>
    resolveSenderInfo(activeConversation, senderId, user, user?.id);

  const startPeerCall = (callType) => {
    if (!activeConversation) return;

    const peer = getConversationPeer(activeConversation);
    if (!peer?.id) return;

    if (!isFriend(peer.id)) {
      window.alert('Chỉ có thể gọi sau khi hai bên đã kết bạn.')
      return
    }

    const params = {
      conversationId: activeConversation.id,
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

  const startAudioCall = () => startPeerCall('AUDIO');
  const startVideoCall = () => startPeerCall('VIDEO');

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleGroupConversationUpdate = (updatedConversation) => {
    upsertConversation(updatedConversation);
    setActiveConversation(updatedConversation, true);
  };

  const handleGroupLeave = () => {
    if (!activeConversation?.id) return;
    removeConversation(activeConversation.id);
    setShowGroupInfo(false);
    navigate('/chat');
  };

  if (!activeConversation) return null;

  return (
    <div className="bg-surface font-sans text-on-surface overflow-hidden h-screen flex flex-1">
      {isGroupChat && (
        <GroupInfoModal
          open={showGroupInfo}
          conversation={activeConversation}
          currentUserId={user?.id}
          friends={friends}
          onClose={() => setShowGroupInfo(false)}
          onConversationUpdate={handleGroupConversationUpdate}
          onLeave={handleGroupLeave}
        />
      )}
      <section className="flex-1 flex flex-col bg-surface overflow-hidden">
          {/* HEADER */}
          <header className="h-16 flex justify-between items-center px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img alt={conversationTitle} className="w-10 h-10 rounded-full object-cover" src={conversationAvatar} />
                {!isGroupChat && (
                  <OnlineIndicator
                    userId={activePeerId}
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"
                  />
                )}
              </div>
              <div>
                <h2 className="font-bold text-on-surface">{conversationTitle}</h2>
                {isGroupChat ? (
                  <p className="text-[10px] text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">groups</span>
                    {memberCount} thành viên
                  </p>
                ) : (
                  <p className={`text-[10px] ${peerOnline ? 'text-green-600' : 'text-outline'} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 ${peerOnline ? 'bg-green-500' : 'bg-outline'} rounded-full`}></span>
                    {peerOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
                {!isGroupChat && (
                  <>
                    <button
                      type="button"
                      onClick={startAudioCall}
                      disabled={!canCallPeer}
                      title="Gọi thoại"
                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Gọi thoại"
                    >
                      <span className="material-symbols-outlined">call</span>
                    </button>
                    <button
                      type="button"
                      onClick={startVideoCall}
                      disabled={!canCallPeer}
                      title="Gọi video"
                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Gọi video"
                    >
                      <span className="material-symbols-outlined">videocam</span>
                    </button>
                  </>
                )}
              <button
                type="button"
                onClick={() => isGroupChat && setShowGroupInfo(true)}
                disabled={!isGroupChat}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Thông tin nhóm"
                title={isGroupChat ? 'Thông tin nhóm' : undefined}
              >
                <span className="material-symbols-outlined">info</span>
              </button>
            </div>
          </header>

          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest/30">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.id;
              const isCallLog = msg.type === 'CALL_LOG';
              const isSticker = msg.type === 'STICKER';
              const senderInfo = getMessageSenderInfo(msg.senderId);
              const showSenderName = isGroupChat && !isMe && !isCallLog;

              if (isCallLog) {
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'items-end gap-2'} max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
                    {!isMe && (
                      <img alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" src={senderInfo.avatar} />
                    )}
                    <div className="bg-surface-container-high text-on-surface-variant px-4 py-2.5 rounded-2xl shadow-sm border border-outline-variant/40">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-base text-primary">call</span>
                        <span>{formatCallLogText(msg.content)}</span>
                      </div>
                      <span className="block text-[10px] text-outline mt-1 text-right">{formatTime(msg.createdAt || msg.sentAt)}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id || index} className={`flex ${isMe ? 'flex-col items-end' : 'items-end gap-2'} max-w-[70%] ${isMe ? 'ml-auto' : ''}`}>
                  {!isMe && (
                    <img alt={senderInfo.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" src={senderInfo.avatar} />
                  )}
                  <div className={`${isMe ? 'items-end' : 'items-start'} flex flex-col max-w-full`}>
                    {showSenderName && (
                      <span className="text-[11px] font-semibold text-outline mb-1 ml-1">{senderInfo.name}</span>
                    )}
                  <div className={`${isSticker ? 'p-1 bg-transparent shadow-none' : `${isMe ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'} p-3 shadow-sm`} rounded-2xl ${isSticker ? '' : isMe ? 'rounded-br-none' : 'rounded-bl-none'} max-w-full`}>
                    {isSticker && msg.fileUrl ? (
                      <img
                        src={msg.fileUrl}
                        alt={findStickerById(msg.content)?.emoji || 'Sticker'}
                        className="w-28 h-28 object-contain"
                      />
                    ) : msg.type === 'IMAGE' && msg.fileUrl ? (
                      <img
                        src={msg.fileUrl}
                        alt="Hình ảnh"
                        className="max-h-56 max-w-full rounded-xl object-cover border border-white/10"
                      />
                    ) : msg.type === 'VOICE' && msg.fileUrl ? (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <span className="material-symbols-outlined text-base shrink-0">mic</span>
                        <audio
                          controls
                          preload="metadata"
                          src={msg.fileUrl}
                          className={`w-full max-w-[220px] h-9 ${isMe ? 'opacity-90' : ''}`}
                        />
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
                    <span className={`block text-[10px] ${isSticker ? 'text-outline' : isMe ? 'text-white/70' : 'text-outline'} mt-1 text-right`}>{formatTime(msg.createdAt || msg.sentAt)}</span>
                  </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <footer className="p-4 bg-surface">
            {isRecording && (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-3 text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium">Đang ghi âm {formatVoiceDuration(durationSec)}</span>
                </div>
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Hủy
                </button>
              </div>
            )}
            <StickerPicker
              open={stickerPickerOpen}
              onClose={() => setStickerPickerOpen(false)}
              onSelect={handleSendSticker}
            />
            <form onSubmit={handleSendMessage} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  className="p-2 text-outline hover:text-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingType !== null || isRecording}
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button
                  type="button"
                  className="p-2 text-outline hover:text-primary transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingType !== null || isRecording}
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
                placeholder={
                  uploadingType === 'VOICE'
                    ? 'Đang gửi tin nhắn thoại...'
                    : uploadingType === 'STICKER'
                      ? 'Đang gửi sticker...'
                    : uploadingType
                      ? 'Đang tải media...'
                      : isRecording
                        ? 'Nhấn mic lần nữa để gửi...'
                        : 'Nhập tin nhắn...'
                } 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={uploadingType !== null || isRecording}
              />
              <div className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={uploadingType !== null}
                  title={isRecording ? 'Gửi tin nhắn thoại' : 'Ghi âm tin nhắn thoại'}
                  className={`p-2 rounded-full transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-outline hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  <span className="material-symbols-outlined">{isRecording ? 'stop' : 'mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPickerOpen((open) => !open)}
                  disabled={uploadingType !== null || isRecording}
                  title="Gửi sticker"
                  className={`p-2 rounded-full transition-colors ${
                    stickerPickerOpen
                      ? 'text-primary bg-primary/10'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined">sentiment_satisfied</span>
                </button>
                <button
                  type="submit"
                  disabled={isRecording || uploadingType !== null}
                  className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </form>
          </footer>
        </section>
    </div>
  );
}

