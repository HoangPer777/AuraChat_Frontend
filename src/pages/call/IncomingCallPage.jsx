import React, { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { clearCallSession, loadCallSession, saveCallSession } from '../../utils/callSession'
import { publishCallEnd } from '../../services/callService'
import { startIncomingRing, stopRing } from '../../utils/callRingtone'
import { getTerminalCallMessage } from '../../utils/callHelpers'
import useCallEndListener from '../../hooks/useCallEndListener'

export default function IncomingCallPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const incomingCall = useMemo(
    () => location.state || loadCallSession(),
    [location.state]
  )

  const leaveCallScreen = useCallback((message) => {
    stopRing()
    clearCallSession()
    if (message?.status) {
      window.alert(getTerminalCallMessage(message.status))
    }
    navigate('/chat', { replace: true })
  }, [navigate])

  useCallEndListener(incomingCall?.callId, leaveCallScreen)

  useEffect(() => {
    if (!incomingCall?.callId) return undefined

    startIncomingRing()
    return () => stopRing()
  }, [incomingCall?.callId])

  if (!incomingCall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Không tìm thấy dữ liệu cuộc gọi</p>
          <button onClick={() => navigate('/chat')} className="px-4 py-2 rounded-xl bg-primary text-white">
            Về trang chat
          </button>
        </div>
      </div>
    )
  }

  const callerName = incomingCall.callerName || incomingCall.senderName || 'Cuộc gọi đến'
  const callerAvatar = incomingCall.callerAvatar || incomingCall.senderAvatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}`

  const handleDecline = async () => {
    stopRing()
    try {
      if (incomingCall.callId) {
        await publishCallEnd({ callId: incomingCall.callId, status: 'DECLINED' })
      }
    } finally {
      clearCallSession()
      navigate('/chat', { replace: true })
    }
  }

  const handleAccept = () => {
    stopRing()
    const acceptedCall = {
      ...incomingCall,
      mode: 'incoming',
      receiverId: incomingCall.receiverId || user?.id,
    }

    saveCallSession(acceptedCall)
    navigate('/call/video', { state: acceptedCall })
  }

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] animate-in slide-in-from-right-10 fade-in duration-500">
        <div className="bg-[#1e1e2e] p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center border border-white/5">
          <div className="relative mb-6">
            <div className="absolute inset-[-8px] border-2 border-primary/40 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-[-12px] border-2 border-primary/20 rounded-full animate-ping delay-150 opacity-10" />
            <div className="w-24 h-24 rounded-full border-2 border-white/10 p-1">
              <img
                src={callerAvatar}
                className="w-full h-full rounded-full object-cover"
                alt={callerName}
              />
            </div>
          </div>

          <h3 className="text-white font-bold text-xl mb-1">{callerName}</h3>
          <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-8">
            Cuộc gọi video đến
          </p>

          <div className="flex gap-10 items-center justify-center w-full">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleDecline}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/20"
              >
                <span className="material-symbols-outlined text-[30px]">call_end</span>
              </button>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Từ chối</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/20"
              >
                <span className="material-symbols-outlined text-[30px]">videocam</span>
              </button>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Chấp nhận</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
