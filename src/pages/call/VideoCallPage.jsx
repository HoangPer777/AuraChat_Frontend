import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRemoteMediaStream } from '../../config/webrtc'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { connect, isConnected, subscribe } from '../../services/websocket'
import { clearCallSession, loadCallSession, saveCallSession } from '../../utils/callSession'
import { getTerminalCallMessage, isCallRingingAck } from '../../utils/callHelpers'
import { startOutgoingRing, stopRing } from '../../utils/callRingtone'
import {
  attachStreamToVideo,
  createPeerConnection,
  getLocalStream,
  publishCallAnswer,
  publishCallEnd,
  publishCallOffer,
  publishIceCandidate,
} from '../../services/callService'
import {
  CallAvatarStage,
  CallBackgroundGlow,
  CallControls,
  CallSignalBadge,
  CallTopBar,
} from '../../components/call/CallUi'

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
  const [hasVideoTrack, setHasVideoTrack] = useState(true)
  const [localPreviewStream, setLocalPreviewStream] = useState(null)
  const [remotePreviewStream, setRemotePreviewStream] = useState(null)
  const [remoteHasVideo, setRemoteHasVideo] = useState(false)
  const [callStatus, setCallStatus] = useState('connecting')
  const [statusText, setStatusText] = useState('Đang khởi tạo cuộc gọi...')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamCollectorRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const pendingRemoteCandidatesRef = useRef([])
  const pendingLocalCandidatesRef = useRef([])
  const callIdRef = useRef(callIntent?.callId || null)
  const selfEndedRef = useRef(false)
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    if (callStatus === 'ringing') {
      startOutgoingRing()
      return () => stopRing()
    }

    if (callStatus === 'connected' || callStatus === 'ended') {
      stopRing()
    }

    return undefined
  }, [callStatus])

  useEffect(() => {
    if (!callIntent) {
      navigate('/chat', { replace: true })
    }
  }, [callIntent, navigate])

  useEffect(() => {
    if (!localPreviewStream || !localVideoRef.current || !isCamOn) return undefined

    attachStreamToVideo(localVideoRef.current, localPreviewStream)

    return undefined
  }, [localPreviewStream, isCamOn])

  useEffect(() => {
    if (!remotePreviewStream || !remoteVideoRef.current) return undefined

    attachStreamToVideo(remoteVideoRef.current, remotePreviewStream)

    return undefined
  }, [remotePreviewStream])

  useEffect(() => {
    if (!remotePreviewStream) {
      setRemoteHasVideo(false)
      return
    }

    const updateRemoteVideo = () => {
      setRemoteHasVideo(
        remotePreviewStream.getVideoTracks().some((track) => track.enabled && track.readyState === 'live')
      )
    }

    updateRemoteVideo()
    remotePreviewStream.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', updateRemoteVideo)
      track.addEventListener('mute', updateRemoteVideo)
      track.addEventListener('unmute', updateRemoteVideo)
    })

    return () => {
      remotePreviewStream.getVideoTracks().forEach((track) => {
        track.removeEventListener('ended', updateRemoteVideo)
        track.removeEventListener('mute', updateRemoteVideo)
        track.removeEventListener('unmute', updateRemoteVideo)
      })
    }
  }, [remotePreviewStream])

  useEffect(() => {
    if (!remotePreviewStream || !remoteAudioRef.current) return undefined

    attachStreamToVideo(remoteAudioRef.current, remotePreviewStream)

    return undefined
  }, [remotePreviewStream])

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
    let removeCallListener = null

    const cleanupMedia = () => {
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalPreviewStream(null)
      setRemotePreviewStream(null)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }

      peerConnectionRef.current?.close?.()
      peerConnectionRef.current = null
      remoteStreamCollectorRef.current = null
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

      if (isCallRingingAck(message) && callIntent.mode === 'outgoing') {
        return true
      }

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

    const finishCall = (message) => {
      stopRing()
      setCallStatus('ended')
      setStatusText(getTerminalCallMessage(message?.status) || message?.message || 'Cuộc gọi đã kết thúc')
      cleanupMedia()
      clearCallSession()

      const isOutgoingCaller = callIntent.mode === 'outgoing'
      const peerDeclined = message?.status === 'DECLINED' || message?.status === 'MISSED'
      const shouldShowBusyNotice = isOutgoingCaller && peerDeclined && !selfEndedRef.current

      window.setTimeout(() => {
        if (shouldShowBusyNotice && callIntent.receiverId) {
          navigateRef.current('/chat/window', {
            replace: true,
            state: {
              friendId: callIntent.receiverId,
              callNotice: 'busy',
            },
          })
          return
        }

        navigateRef.current('/chat', { replace: true })
      }, 600)
    }

    const handleCallMessage = async (message) => {
      if (!mounted || !message) return

      if (!isMessageForCurrentCall(message)) {
        return
      }

      if (message.callId) {
        resolveCallId(message.callId)
      }

      if (isCallRingingAck(message)) {
        return
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
        finishCall(message)
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

    const attachRemoteStream = (event) => {
      if (!remoteStreamCollectorRef.current) {
        remoteStreamCollectorRef.current = createRemoteMediaStream()
      }

      remoteStreamCollectorRef.current.addFromTrackEvent(event)
      setRemotePreviewStream(new MediaStream(remoteStreamCollectorRef.current.getStream().getTracks()))
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
      const callType = callIntent.type || 'VIDEO'
      const isAudioCall = callType === 'AUDIO'
      const localStream = await getLocalStream(callType)
      if (!mounted) return

      const streamHasVideo = localStream.getVideoTracks().length > 0
      setHasVideoTrack(streamHasVideo)
      if (!streamHasVideo || isAudioCall) {
        setIsCamOn(false)
      }

      localStreamRef.current = localStream
      if (!isAudioCall && streamHasVideo) {
        setLocalPreviewStream(localStream)
      }

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
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: !isAudioCall,
        })
        await peerConnection.setLocalDescription(offer)

        const published = await publishCallOffer({
          receiverId: callIntent.receiverId,
          type: callType,
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
          createdAt: new Date().toISOString(),
        })
      }
    }

    const initialize = async () => {
      try {
        await connect()
        if (!mounted) return

        removeCallListener = subscribe('/user/queue/call', handleCallMessage)
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
      removeCallListener?.()
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
    stopRing()
    selfEndedRef.current = true
    try {
      if (callIdRef.current) {
        publishCallEnd({ callId: callIdRef.current })
      }
    } finally {
      clearCallSession()
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      peerConnectionRef.current?.close?.()
      navigate('/chat', { replace: true })
    }
  }

  const remoteName = callIntent?.receiverName || callIntent?.callerName || 'Đang gọi'
  const localLabel = user?.displayName || user?.email || 'Bạn'
  const isAudioCall = (callIntent?.type || 'VIDEO') === 'AUDIO'
  const remoteAvatar = callIntent?.receiverAvatar || callIntent?.callerAvatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteName)}`
  const callTypeLabel = isAudioCall ? 'Cuộc gọi thoại' : 'Cuộc gọi video'
  const showRemoteVideo = !isAudioCall && remoteHasVideo
  const showAvatarStage = isAudioCall || !showRemoteVideo

  if (!callIntent) {
    return null
  }

  return (
    <div className="bg-[#0f0f13] h-screen w-screen overflow-hidden text-white font-sans relative">
      <audio ref={remoteAudioRef} autoPlay playsInline muted={false} className="sr-only" />

      {showRemoteVideo ? (
        <div className="absolute inset-0 z-0">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90 bg-black" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1e1e2e] to-[#0f0f13]">
          <CallBackgroundGlow />
        </div>
      )}

      <CallTopBar
        remoteName={remoteName}
        timer={formatTime(timer)}
        statusLabel={callTypeLabel}
        isConnected={callStatus === 'connected'}
      />

      {showAvatarStage && (
        <CallAvatarStage
          remoteName={remoteName}
          remoteAvatar={remoteAvatar}
          statusText={statusText}
          isRinging={callStatus === 'ringing'}
          isConnected={callStatus === 'connected' && isAudioCall}
        />
      )}

      {!isAudioCall && (
        <div className="absolute bottom-32 right-4 sm:right-8 z-30 w-36 sm:w-48 aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform hover:scale-105 bg-[#1e1e2e]">
          {isCamOn && hasVideoTrack ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full bg-[#1e1e2e] flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-white/20">videocam_off</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {localLabel}
          </div>
        </div>
      )}

      <CallSignalBadge callStatus={callStatus} statusText={statusText} />

      <CallControls
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        showCamera={!isAudioCall}
        showScreenShare={!isAudioCall}
        onToggleMic={() => {
          const next = !isMicOn
          setIsMicOn(next)
          toggleTrack('audio', next)
        }}
        onToggleCam={() => {
          const next = !isCamOn
          setIsCamOn(next)
          toggleTrack('video', next)
          if (next && localStreamRef.current && hasVideoTrack) {
            setLocalPreviewStream(localStreamRef.current)
          }
        }}
        onEndCall={handleEndCall}
      />
    </div>
  )
}
