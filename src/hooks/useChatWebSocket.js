import { useEffect, useRef } from 'react'
import { connect, isConnected, subscribe, unsubscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'

/**
 * Hook để subscribe real-time messages và presence updates qua WebSocket.
 * - /user/queue/messages  → nhận tin nhắn mới từ backend (Redis pub/sub → STOMP)
 * - /user/queue/presence  → nhận cập nhật trạng thái online/offline của bạn bè
 *
 * Gọi hook này ở bất kỳ page nào cần real-time chat (ChatPage, ChatWindowPage, HomePage).
 * Chỉ gọi một lần per page — không gọi ở nhiều component cùng lúc trên cùng page.
 */
export default function useChatWebSocket() {
  const { accessToken, user } = useAuthStore()

  // Dùng ref để đọc state mới nhất trong callback mà không cần re-subscribe
  const storeRef = useRef(null)
  storeRef.current = useChatStore.getState()

  useEffect(() => {
    if (!accessToken || !user?.id) return undefined

    let active = true

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        // Subscribe tin nhắn real-time
        subscribe('/user/queue/messages', (message) => {
          if (!active || !message?.id) return

          const store = useChatStore.getState()
          const currentConv = store.activeConversation

          // Chỉ thêm vào messages nếu đang xem đúng conversation
          if (currentConv && message.conversationId === currentConv.id) {
            // Dedup: không thêm nếu message đã tồn tại (do REST response đã add trước)
            const alreadyExists = store.messages.some((m) => m.id === message.id)
            if (!alreadyExists) {
              store.addMessage(message)
            }
          }

          // Luôn cập nhật lastMessage trong conversation list
          store.updateConversationLastMessage(message.conversationId, {
            content: message.content,
            senderId: message.senderId,
            sentAt: message.createdAt,
            type: message.type,
          })
        })

        // Subscribe presence updates
        subscribe('/user/queue/presence', (presence) => {
          if (!active || !presence?.userId) return
          useChatStore.getState().setFriendOnlineStatus(presence.userId, presence.status === 'online')
        })
      } catch (error) {
        console.warn('Chat WebSocket subscription failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      unsubscribe('/user/queue/messages')
      unsubscribe('/user/queue/presence')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.id])
}
