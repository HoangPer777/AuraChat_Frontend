import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { connect, disconnect, isConnected, subscribe, unsubscribe } from '../../services/websocket'
import { clearCallSession, loadCallSession, saveCallSession } from '../../utils/callSession'
import {
  createPeerConnection,
  getLocalStream,
  publishCallAnswer,
  publishCallEnd,
  publishCallOffer,
  publishIceCandidate,
} from '../../services/callService'

function generateCallId() {
  if (window.crypto?.randomUUID) {
    return `call_${window.crypto.randomUUID()}`
  }

  return `call_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export default function VideoCallPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const callIntent = useMemo(() => location.state || loadCallSession(), [location.state])
  const [timer, setTimer] = useState(0)
  const [callStartedAt, setCallStartedAt] = useState(() => {
    const timestamp =
      callIntent?.connectedAt ||
      callIntent?.acceptedAt ||
      callIntent?.startedAt ||
      callIntent?.createdAt

    if (!timestamp) return null

    const parsed = new Date(timestamp).getTime()
    return Number.isNaN(parsed) ? null : parsed
  })
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [callStatus, setCallStatus] = useState('connecting')
  const [statusText, setStatusText] = useState('Đang khởi tạo cuộc gọi...')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const pendingRemoteCandidatesRef = useRef([])
  const pendingLocalCandidatesRef = useRef([])
  const callIdRef = useRef(callIntent?.callId || null)

  useEffect(() => {
    if (!callIntent) {
      navigate('/chat', { replace: true })
    }
  }, [callIntent, navigate])

  useEffect(() => {
    if (callStatus !== 'connected' || !callStartedAt) {
      setTimer(0)
      return undefined
    }

    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000))
      setTimer(elapsed)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [callStartedAt, callStatus])

  useEffect(() => {
    if (!callIntent) return undefined

    let mounted = true
    let subscriptionActive = false

    const cleanupMedia = async () => {
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      localStreamRef.current = null

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      peerConnectionRef.current?.close?.()
      peerConnectionRef.current = null

      if (isConnected()) {
        await disconnect().catch(() => {})
      }
    }

    const resolveTimestampMs = (...values) => {
      for (const value of values) {
        if (!value) continue
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value
        }

        const parsed = new Date(value).getTime()
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }

      return Date.now()
    }

    const syncConnectedTime = (...candidates) => {
      const nextStartedAt = resolveTimestampMs(...candidates)

      setCallStartedAt((prev) => {
        if (!prev) return nextStartedAt

        // Prefer the new timestamp if drift is large enough to indicate unsynced clocks.
        if (Math.abs(prev - nextStartedAt) > 2000) {
          return nextStartedAt
        }

        return prev
      })

      const connectedAtIso = new Date(nextStartedAt).toISOString()
      saveCallSession({
        ...callIntent,
        callId: callIdRef.current,
        connectedAt: connectedAtIso,
      })
    }

    const flushBufferedLocalCandidates = () => {
      if (!callIdRef.current || pendingLocalCandidatesRef.current.length === 0) {
        return
      }

      const receiverId = callIntent.mode === 'incoming' ? callIntent.callerId : callIntent.receiverId
      if (!receiverId) return

      const queuedCandidates = [...pendingLocalCandidatesRef.current]
      pendingLocalCandidatesRef.current = []

      queuedCandidates.forEach((candidate) => {
        const published = publishIceCandidate({
          callId: callIdRef.current,
          senderId: user?.id,
          receiverId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        })

        if (!published) {
          pendingLocalCandidatesRef.current.push(candidate)
        }
      })
    }

    const resolveCallId = (nextCallId) => {
      if (!nextCallId) return
      if (callIdRef.current === nextCallId) {
        flushBufferedLocalCandidates()
        return
      }

      callIdRef.current = nextCallId
      saveCallSession({ ...callIntent, callId: nextCallId })
      flushBufferedLocalCandidates()
    }

    const flushBufferedCandidates = async () => {
      const peerConnection = peerConnectionRef.current
      if (!peerConnection || !peerConnection.remoteDescription) return

      for (const candidate of pendingRemoteCandidatesRef.current) {
        try {
          await peerConnection.addIceCandidate(candidate)
        } catch (error) {
          console.warn('Failed to add buffered ICE candidate:', error)
        }
      }

      pendingRemoteCandidatesRef.current = []
    }

    const isMessageForCurrentCall = (message) => {
      if (!message) return false

      if (callIntent.mode === 'incoming') {
        if (!callIdRef.current || !message.callId) return true
        return message.callId === callIdRef.current
      }

      if (message.callerId && message.callerId !== user?.id) return false
      if (message.senderId && message.senderId !== callIntent.receiverId) return false

      if (
        message.receiverId &&
        message.receiverId !== user?.id &&
        message.receiverId !== callIntent.receiverId
      ) {
        return false
      }

      if (message.callId && callIdRef.current && message.callId !== callIdRef.current) {
        return false
      }

      return true
    }

    const handleCallMessage = async (message) => {
      if (!mounted || !message) return

      if (!isMessageForCurrentCall(message)) {
        return
      }

      if (message.callId) {
        resolveCallId(message.callId)
      }

      if (message.candidate) {
        const peerConnection = peerConnectionRef.current
        if (!peerConnection) return

        const iceCandidate = new RTCIceCandidate({
          candidate: message.candidate,
          sdpMid: message.sdpMid,
          sdpMLineIndex: message.sdpMLineIndex,
        })

        if (peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(iceCandidate).catch((error) => {
            console.warn('Error adding ICE candidate:', error)
          })
        } else {
          pendingRemoteCandidatesRef.current.push(iceCandidate)
        }

        return
      }

      if (message.status === 'DECLINED' || message.status === 'COMPLETED' || message.status === 'MISSED') {
        setCallStatus('ended')
        setStatusText(message.message || 'Cuộc gọi đã kết thúc')
        await cleanupMedia()
        clearCallSession()
        return
      }

      if (callIntent.mode === 'outgoing' && message.sdp) {
        const peerConnection = peerConnectionRef.current
        if (!peerConnection) return

        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: message.sdp }))
        await flushBufferedCandidates()
        syncConnectedTime(message.acceptedAt, message.startedAt, message.createdAt)
        setCallStatus('connected')
        setStatusText('Cuộc gọi đã được kết nối')
      }
    }

    const attachStreamToLocalPreview = (stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    }

    const attachRemoteStream = (event) => {
      const [remoteStream] = event.streams
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    const sendIceCandidate = (candidate) => {
      if (!candidate) return

      if (!callIdRef.current) {
        pendingLocalCandidatesRef.current.push(candidate)
        return
      }

      const receiverId = callIntent.mode === 'incoming' ? callIntent.callerId : callIntent.receiverId
      if (!receiverId) return

      const published = publishIceCandidate({
        callId: callIdRef.current,
        senderId: user?.id,
        receiverId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      })

      if (!published) {
        pendingLocalCandidatesRef.current.push(candidate)
      }
    }

    const createConnection = async () => {
      const localStream = await getLocalStream(callIntent.type || 'VIDEO')
      if (!mounted) return

      localStreamRef.current = localStream
      attachStreamToLocalPreview(localStream)

      const peerConnection = createPeerConnection({
        onTrack: attachRemoteStream,
        onIceCandidate: sendIceCandidate,
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setCallStatus('connected')
            setStatusText('Cuộc gọi đã kết nối')
            syncConnectedTime(callIntent.connectedAt, callIntent.acceptedAt)
          }

          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            setCallStatus('ended')
          }
        },
      })

      peerConnectionRef.current = peerConnection
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream))

      if (callIntent.mode === 'incoming') {
        resolveCallId(callIntent.callId)
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: callIntent.sdp }))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        const acceptedAt = new Date().toISOString()

        const published = await publishCallAnswer({
          callId: callIntent.callId,
          callerId: callIntent.callerId,
          receiverId: callIntent.receiverId || user?.id,
          sdp: answer.sdp,
          acceptedAt,
        })

        if (!published) {
          throw new Error('Không thể gửi câu trả lời cuộc gọi')
        }

        setCallStatus('connected')
        setStatusText('Đã chấp nhận cuộc gọi')
        syncConnectedTime(acceptedAt)
        await flushBufferedCandidates()
      } else {
        const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        await peerConnection.setLocalDescription(offer)

        const published = await publishCallOffer({
          receiverId: callIntent.receiverId,
          type: callIntent.type || 'VIDEO',
          conversationId: callIntent.conversationId,
          sdp: offer.sdp,
        })

        if (!published) {
          throw new Error('Không thể gửi lời mời gọi')
        }

        setCallStatus('ringing')
        setStatusText('Đang đổ chuông...')
        saveCallSession({
          ...callIntent,
          clientCallId: generateCallId(),
          createdAt: new Date().toISOString(),
        })
      }
    }

    const initialize = async () => {
      try {
        await connect()
        if (!mounted) return

        subscribe('/user/queue/call', handleCallMessage)
        subscriptionActive = true
        await createConnection()
      } catch (error) {
        console.error('Failed to initialize call:', error)
        setCallStatus('ended')
        setStatusText(error.message || 'Không thể khởi tạo cuộc gọi')
      }
    }

    initialize()

    return () => {
      mounted = false
      if (subscriptionActive) {
        unsubscribe('/user/queue/call')
      }
      cleanupMedia()
    }
  }, [callIntent, user?.id])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTrack = (kind, enabled) => {
    const track = localStreamRef.current?.getTracks?.().find((item) => item.kind === kind)
    if (track) {
      track.enabled = enabled
    }
  }

  const handleEndCall = async () => {
    try {
      await publishCallEnd({ callId: callIdRef.current })
    } finally {
      clearCallSession()
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      peerConnectionRef.current?.close?.()
      navigate(-1)
    }
  }

  const remoteName = callIntent?.receiverName || callIntent?.callerName || 'Đang gọi'
  const localLabel = user?.displayName || user?.email || 'Bạn'

  if (!callIntent) {
    return null
  }

  return (
    <div className="bg-[#0f0f13] h-screen w-screen overflow-hidden text-white font-sans relative">
      {/* Remote Video (Background) */}
      <div className="absolute inset-0 z-0">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80 bg-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Top Header */}
      <header className="absolute top-0 left-0 w-full pt-12 flex flex-col items-center z-20">
        <div className="bg-white/10 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
          <div className="flex flex-col items-center">
             <h1 className="text-sm font-bold tracking-tight">{remoteName}</h1>
             <span className="text-[10px] font-bold text-primary-fixed-dim tracking-[0.2em]">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Picture in Picture (Self View) */}
      <div className="absolute bottom-32 right-8 z-30 w-48 aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl group transition-transform hover:scale-105 bg-black">
        <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isCamOn ? '' : 'hidden'}`} />
        {!isCamOn && (
          <div className="w-full h-full bg-[#1e1e2e] flex items-center justify-center">
             <span className="material-symbols-outlined text-4xl text-white/20">videocam_off</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          {localLabel}
        </div>
      </div>

      {/* Side Toolbar */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
         {[
           { icon: 'chat', label: 'Chat' },
           { icon: 'group', label: 'People' },
           { icon: 'settings', label: 'Settings' }
         ].map(item => (
           <button key={item.icon} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group relative">
             <span className="material-symbols-outlined text-[22px] text-white/70 group-hover:text-white">{item.icon}</span>
             <span className="absolute right-14 bg-black/80 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
           </button>
         ))}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-40 px-6">
        <div className="bg-white/10 backdrop-blur-3xl rounded-[32px] p-4 flex items-center gap-4 border border-white/10 shadow-2xl">
          <button
            onClick={() => {
              const next = !isMicOn
              setIsMicOn(next)
              toggleTrack('audio', next)
            }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <span className="material-symbols-outlined">{isMicOn ? 'mic' : 'mic_off'}</span>
          </button>
          
          <button
            onClick={() => {
              const next = !isCamOn
              setIsCamOn(next)
              toggleTrack('video', next)
            }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <span className="material-symbols-outlined">{isCamOn ? 'videocam' : 'videocam_off'}</span>
          </button>

          <button className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
            <span className="material-symbols-outlined">screen_share</span>
          </button>

          <button className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>

          <div className="w-[1px] h-10 bg-white/10 mx-2"></div>

          <button
            onClick={handleEndCall}
            className="h-14 px-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-3 transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span>Kết thúc</span>
          </button>
        </div>
      </div>

      {/* Signal Info */}
      <div className="absolute bottom-10 left-8 flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
        <span className="material-symbols-outlined text-green-500">signal_cellular_alt</span>
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none">{callStatus === 'connected' ? 'HD Quality' : 'Kết nối cuộc gọi'}</span>
           <span className="text-[9px] font-medium text-white/30 mt-1">{statusText}</span>
        </div>
      </div>
    </div>
  )
}
