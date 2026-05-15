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
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [callStatus, setCallStatus] = useState('connecting')
  const [statusText, setStatusText] = useState('Đang khởi tạo cuộc gọi...')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const pendingCandidatesRef = useRef([])
  const callIdRef = useRef(callIntent?.callId || generateCallId())

  useEffect(() => {
    if (!callIntent) {
      navigate('/test-ui/home', { replace: true })
      return undefined
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [callIntent, navigate])

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

    const flushBufferedCandidates = async () => {
      const peerConnection = peerConnectionRef.current
      if (!peerConnection || !peerConnection.remoteDescription) return

      for (const candidate of pendingCandidatesRef.current) {
        try {
          await peerConnection.addIceCandidate(candidate)
        } catch (error) {
          console.warn('Failed to add buffered ICE candidate:', error)
        }
      }

      pendingCandidatesRef.current = []
    }

    const handleCallMessage = async (message) => {
      if (!mounted || !message) return

      if (message.callId && message.callId !== callIdRef.current && message.receiverId !== user?.id) {
        return
      }

      if (message.callId && !callIdRef.current) {
        callIdRef.current = message.callId
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
          pendingCandidatesRef.current.push(iceCandidate)
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
      if (!callIdRef.current) return

      publishIceCandidate({
        callId: callIdRef.current,
        senderId: user?.id,
        receiverId: callIntent.mode === 'incoming' ? callIntent.callerId : callIntent.receiverId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      })
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
          }

          if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            setCallStatus('ended')
          }
        },
      })

      peerConnectionRef.current = peerConnection
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream))

      if (callIntent.mode === 'incoming') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: callIntent.sdp }))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        const published = publishCallAnswer({
          callId: callIntent.callId,
          callerId: callIntent.callerId,
          receiverId: callIntent.receiverId || user?.id,
          sdp: answer.sdp,
        })

        if (!published) {
          throw new Error('Không thể gửi câu trả lời cuộc gọi')
        }

        setCallStatus('connected')
        setStatusText('Đã chấp nhận cuộc gọi')
        await flushBufferedCandidates()
      } else {
        const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        await peerConnection.setLocalDescription(offer)

        const published = publishCallOffer({
          callId: callIdRef.current,
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
        saveCallSession({ ...callIntent, callId: callIdRef.current })
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
