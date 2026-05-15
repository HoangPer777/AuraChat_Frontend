import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { connect, isConnected, subscribe, unsubscribe } from '../services/websocket'
import useAuthStore from '../store/authStore'
import { saveCallSession } from '../utils/callSession'

function isCallOffer(message) {
  return message?.callId && message?.sdp && (message?.type === 'VIDEO' || message?.type === 'AUDIO')
}

export default function useIncomingCallNotifications() {
  const navigate = useNavigate()
  const { user, accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken || !user?.id) return undefined

    let active = true
    let subscription = null

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        subscription = subscribe('/user/queue/call', (message) => {
          if (!active || !isCallOffer(message)) return
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

          navigate('/test-ui/incoming-call', { state: message })
        })
      } catch (error) {
        console.warn('Incoming call subscription failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      if (subscription) {
        unsubscribe('/user/queue/call')
      }
    }
  }, [accessToken, navigate, user?.id])
}
