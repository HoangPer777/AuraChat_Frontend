import { useEffect } from 'react'
import { connect, isConnected, subscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import { isMessageForActiveConversation } from '../utils/chatMessages'

/**
 * Subscribe real-time messages và presence qua STOMP.
 * Được mount một lần trong UserLayout.
 */
export default function useChatWebSocket() {
  const { accessToken, user } = useAuthStore()

  useEffect(() => {
    if (!accessToken || !user?.id) return undefined

    let active = true
    let removeMessagesListener = null
    let removePresenceListener = null

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        removeMessagesListener = subscribe('/user/queue/messages', (message) => {
          if (!active || !message?.id) return

          const store = useChatStore.getState()
          const currentConv = store.activeConversation

          if (isMessageForActiveConversation(message, currentConv, user.id)) {
            if (currentConv?.id?.startsWith('temp_') && message.conversationId) {
              store.patchActiveConversation({ id: message.conversationId })
            }

            const alreadyExists = store.messages.some((m) => m.id === message.id)
            if (!alreadyExists) {
              store.addMessage(message)
            }
          }

          store.updateConversationLastMessage(message.conversationId, {
            content: message.content,
            senderId: message.senderId,
            sentAt: message.createdAt,
            type: message.type,
          })
        })

        removePresenceListener = subscribe('/user/queue/presence', (presence) => {
          if (!active || !presence?.userId) return
          useChatStore.getState().setFriendOnlineStatus(
            presence.userId,
            presence.status === 'online'
          )
        })
      } catch (error) {
        console.warn('Chat WebSocket subscription failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      removeMessagesListener?.()
      removePresenceListener?.()
    }
  }, [accessToken, user?.id])
}
