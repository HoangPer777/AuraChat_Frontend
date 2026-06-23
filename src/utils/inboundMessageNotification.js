import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import useNotificationStore from '../store/notificationStore'
import {
  getConversationAvatar,
  getConversationDisplayName,
  resolveSenderInfo,
} from './conversationHelpers'
import { showBrowserNotification } from './browserNotification'

export function buildMessagePreview(message) {
  if (!message) return 'Tin nhắn mới'
  if (message.type === 'IMAGE') return 'Đã gửi một hình ảnh'
  if (message.type === 'STICKER') return 'Sticker'
  if (message.type === 'VOICE') return 'Tin nhắn thoại'
  if (message.type === 'FILE') return 'Đã gửi một tệp'
  if (message.type === 'CALL_LOG') return 'Cuộc gọi'
  return message.content || 'Tin nhắn mới'
}

function shouldSkipBrowserNotify(message, userId) {
  const { activeConversation } = useChatStore.getState()
  return (
    activeConversation?.id === message.conversationId
    && document.hasFocus()
  )
}

export function notifyInboundMessage(message, userId) {
  if (!message?.id || !userId || message.senderId === userId) return
  if (message.type === 'CALL_LOG') return

  const conversations = useChatStore.getState().conversations
  const conversation = conversations.find((conv) => conv.id === message.conversationId)
  const currentUser = useAuthStore.getState().user
  const sender = resolveSenderInfo(conversation, message.senderId, currentUser, userId)
  const preview = buildMessagePreview(message)

  const isGroup = conversation?.type === 'GROUP'
  const title = isGroup
    ? (getConversationDisplayName(conversation, userId) || 'Nhóm chat')
    : sender.name
  const notificationMessage = isGroup ? `${sender.name}: ${preview}` : preview
  const avatar = isGroup
    ? getConversationAvatar(conversation, userId)
    : sender.avatar

  useNotificationStore.getState().addNotification({
    id: `msg-conv-${message.conversationId}`,
    type: 'MESSAGE',
    title,
    message: notificationMessage,
    avatar,
    senderId: message.senderId,
    conversationId: message.conversationId,
    messageId: message.id,
    route: '/chat/window',
    createdAt: message.createdAt || new Date().toISOString(),
  })

  if (!shouldSkipBrowserNotify(message, userId)) {
    showBrowserNotification({
      title: isGroup ? `${title} — ${sender.name}` : title,
      body: preview,
      icon: avatar,
      tag: `msg-${message.conversationId}`,
      data: { route: '/chat/window', conversationId: message.conversationId },
      onClick: () => window.location.assign('/chat/window'),
    })
  }
}
