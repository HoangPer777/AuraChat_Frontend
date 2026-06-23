import { useEffect } from 'react'
import { connect, isConnected, subscribe } from '../services/websocket'
import { isTerminalCallStatus } from '../utils/callHelpers'

/**
 * Lắng nghe kết thúc cuộc gọi từ phía đối phương (decline / cancel / timeout / end).
 */
export default function useCallEndListener(callId, onEnded) {
  useEffect(() => {
    if (!callId || !onEnded) return undefined

    let active = true
    let removeListener = null

    const setup = async () => {
      try {
        await connect()
        if (!active || !isConnected()) return

        removeListener = subscribe('/user/queue/call', (message) => {
          if (!active || !message?.callId || message.callId !== callId) return
          if (isTerminalCallStatus(message)) {
            onEnded(message)
          }
        })
      } catch (error) {
        console.warn('Call end listener failed:', error)
      }
    }

    setup()

    return () => {
      active = false
      removeListener?.()
    }
  }, [callId, onEnded])
}
