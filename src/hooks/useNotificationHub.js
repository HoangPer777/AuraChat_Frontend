import { useEffect } from 'react'
import { connect, isConnected, subscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import useNotificationStore from '../store/notificationStore'
import { showBrowserNotification } from '../utils/browserNotification'
import { isGroupCallInvite } from '../utils/callHelpers'

function buildMessagePreview(message) {
  if (!message) return 'Tin nhắn mới'
  if (message.type === 'IMAGE') return 'Đã gửi một hình ảnh'
  if (message.type === 'STICKER') return 'Sticker'
  if (message.type === 'VOICE') return 'Tin nhắn thoại'
  if (message.type === 'FILE') return 'Đã gửi một tệp'
  if (message.type === 'CALL_LOG') return 'Cuộc gọi'
  return message.content || 'Tin nhắn mới'
}

export default function useNotificationHub() {
  const { accessToken, user } = useAuthStore()
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!accessToken || !user?.id) return undefined

    let active = true
    const removeListeners = []

    const pushBrowser = (payload) => {
      showBrowserNotification(payload)
    }

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        removeListeners.push(
          subscribe('/user/queue/friend-requests', (message) => {
            if (!active || !message?.type || !message?.request) return

            if (message.type === 'FRIEND_REQUEST_CREATED') {
              const sender = message.request?.sender
              const senderName = sender?.displayName || 'Ai đó'
              addNotification({
                id: `friend-${message.request.id}`,
                type: 'FRIEND_REQUEST',
                title: senderName,
                message: 'đã gửi lời mời kết bạn',
                avatar: sender?.avatarUrl,
                requestId: message.request.id,
                route: '/notifications',
              })
              pushBrowser({
                title: 'Lời mời kết bạn',
                body: `${senderName} muốn kết bạn với bạn`,
                icon: sender?.avatarUrl,
                tag: `friend-${message.request.id}`,
                data: { route: '/notifications' },
                onClick: () => window.location.assign('/notifications'),
              })
            }
          }),
        )

        removeListeners.push(
          subscribe('/user/queue/messages', (message) => {
            if (!active || !message?.id || message.senderId === user.id) return

            const activeConversation = useChatStore.getState().activeConversation
            if (activeConversation?.id === message.conversationId && document.hasFocus()) {
              return
            }

            const preview = buildMessagePreview(message)
            addNotification({
              id: `msg-${message.id}`,
              type: 'MESSAGE',
              title: 'Tin nhắn mới',
              message: preview,
              conversationId: message.conversationId,
              messageId: message.id,
              route: '/chat/window',
            })
            pushBrowser({
              title: 'Tin nhắn mới',
              body: preview,
              tag: `msg-${message.conversationId}`,
              data: { route: '/chat/window', conversationId: message.conversationId },
              onClick: () => window.location.assign('/chat/window'),
            })
          }),
        )

        removeListeners.push(
          subscribe('/user/queue/call', (message) => {
            if (!active || !message) return

            const isPrivateCall = message.sdp && message.callerId && message.receiverId === user.id
            const isGroupInvite = isGroupCallInvite(message)

            if (!isPrivateCall && !isGroupInvite) return

            const title = isGroupInvite
              ? (message.groupName || 'Cuộc gọi nhóm')
              : (message.callerName || 'Cuộc gọi đến')

            const callType = message.type === 'AUDIO' ? 'thoại' : 'video'
            const body = isGroupInvite
              ? `Cuộc gọi ${callType} nhóm`
              : `Cuộc gọi ${callType} đến`

            addNotification({
              id: `call-${message.callId}`,
              type: 'CALL',
              title,
              message: body,
              callId: message.callId,
              route: '/call/incoming',
            })

            pushBrowser({
              title,
              body,
              tag: `call-${message.callId}`,
              data: { route: '/call/incoming' },
              onClick: () => window.location.assign('/call/incoming'),
            })
          }),
        )
      } catch (error) {
        console.warn('Notification hub setup failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      removeListeners.forEach((remove) => remove?.())
    }
  }, [accessToken, addNotification, user?.id])
}
