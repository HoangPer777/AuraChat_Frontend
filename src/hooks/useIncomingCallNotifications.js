import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { connect, isConnected, subscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import { saveCallSession } from '../utils/callSession'
import { isGroupCallInvite, getCallRoute } from '../utils/callHelpers'

function isIncomingCallOffer(message) {
  return Boolean(
    message?.callId
    && message?.sdp
    && message?.callerId
    && message?.receiverId
    && (message?.type === 'VIDEO' || message?.type === 'AUDIO')
  )
}

export default function useIncomingCallNotifications() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const { user, accessToken } = useAuthStore()

  navigateRef.current = navigate

  useEffect(() => {
    if (!accessToken || !user?.id) return undefined

    let active = true
    let removeListener = null

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        removeListener = subscribe('/user/queue/call', (message) => {
          if (!active) return

          if (isGroupCallInvite(message)) {
            saveCallSession({
              mode: 'group-incoming',
              callId: message.callId,
              callerId: message.callerId,
              conversationId: message.conversationId,
              groupName: message.groupName,
              type: message.type || 'VIDEO',
            })
            navigateRef.current('/call/incoming', { state: { ...message, isGroupCall: true } })
            return
          }

          if (!isIncomingCallOffer(message)) return
          if (message.receiverId && message.receiverId !== user.id) return

          saveCallSession({
            mode: 'incoming',
            callId: message.callId,
            callerId: message.callerId,
            receiverId: message.receiverId,
            conversationId: message.conversationId,
            type: message.type || 'VIDEO',
            sdp: message.sdp,
            createdAt: message.createdAt,
            startedAt: message.startedAt,
            acceptedAt: message.acceptedAt,
            callerName: message.callerName || message.senderName || 'Cuộc gọi đến',
            callerAvatar: message.callerAvatar || message.senderAvatar || '',
          })

          navigateRef.current('/call/incoming', { state: message })
        })
      } catch (error) {
        console.warn('Incoming call subscription failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      removeListener?.()
    }
  }, [accessToken, user?.id])
}
