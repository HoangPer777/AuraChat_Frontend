import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { connect, subscribe } from '../../services/websocket'
import { clearCallSession, loadCallSession, saveCallSession } from '../../utils/callSession'
import { getTerminalCallMessage, isGroupCallSignal } from '../../utils/callHelpers'
import { createGroupMeshManager } from '../../utils/groupCallMesh'
import {
  attachStreamToVideo,
  getLocalStream,
  publishGroupCallEnd,
  publishGroupCallJoin,
  publishGroupCallLeave,
  publishGroupCallOffer,
  publishGroupPeerAnswer,
  publishGroupPeerOffer,
  publishIceCandidate,
} from '../../services/callService'

function participantLabel(participant, userId) {
  return participant?.displayName || participant?.name || `User ${userId?.slice(-6) || '?'}`
}

function participantAvatar(participant, userId) {
  const name = participantLabel(participant, userId)
  return participant?.avatarUrl || participant?.avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
}

export default function GroupCallPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const callIntent = useMemo(() => location.state || loadCallSession(), [location.state])

  const [callStatus, setCallStatus] = useState('connecting')
  const [statusText, setStatusText] = useState('Đang kết nối cuộc gọi nhóm...')
  const [timer, setTimer] = useState(0)
  const [callStartedAt, setCallStartedAt] = useState(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [hasVideoTrack, setHasVideoTrack] = useState(true)
  const [localPreviewStream, setLocalPreviewStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({})
  const [participants, setParticipants] = useState({})
  const [showPeople, setShowPeople] = useState(false)

  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const meshRef = useRef(null)
  const callIdRef = useRef(callIntent?.callId || null)
  const selfEndedRef = useRef(false)
  const participantsRef = useRef({})

  const isHost = callIntent?.mode === 'group-host'
  const isVideoCall = (callIntent?.type || 'VIDEO') === 'VIDEO'
  const groupName = callIntent?.groupName || 'Cuộc gọi nhóm'

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
    if (callStatus !== 'connected' || !callStartedAt) {
      setTimer(0)
      return undefined
    }
    const interval = setInterval(() => {
      setTimer(Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [callStatus, callStartedAt])

  useEffect(() => {
    if (!callIntent || !user?.id) return undefined

    let mounted = true
    let removeListener = null

    const updateParticipants = () => {
      setParticipants({ ...participantsRef.current })
    }

    const setRemoteStream = (userId, stream) => {
      setRemoteStreams((prev) => ({ ...prev, [userId]: stream }))
    }

    const removeRemoteStream = (userId) => {
      setRemoteStreams((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }

    const sendIceCandidate = (remoteUserId, candidate) => {
      if (!callIdRef.current || !candidate) return
      publishIceCandidate({
        callId: callIdRef.current,
        senderId: user.id,
        receiverId: remoteUserId,
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
      })
    }

    const offerToParticipant = async (participant) => {
      if (!participant?.userId || participant.userId === user.id) return
      if (meshRef.current?.hasPeerConnection(participant.userId)) return

      const sdp = await meshRef.current.createOfferToPeer(
        participant.userId,
        localStreamRef.current,
        isVideoCall,
      )

      publishGroupPeerOffer({
        callId: callIdRef.current,
        targetUserId: participant.userId,
        sdp,
      })
    }

    const connectToParticipants = async (participantList) => {
      for (const participant of participantList) {
        participantsRef.current[participant.userId] = participant
        await offerToParticipant(participant)
      }
      updateParticipants()
      setCallStatus('connected')
      setStatusText('Cuộc gọi nhóm đã kết nối')
      setCallStartedAt((prev) => prev || Date.now())
    }

    const finishCall = (message) => {
      setCallStatus('ended')
      setStatusText(getTerminalCallMessage(message?.status) || message?.message || 'Cuộc gọi nhóm đã kết thúc')
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      meshRef.current?.closeAll?.()
      clearCallSession()
      window.setTimeout(() => navigate('/chat', { replace: true }), 600)
    }

    const handleMessage = async (message) => {
      if (!mounted || !message) return
      if (!isGroupCallSignal(message) && !message.candidate) return

      if (message.callId && !callIdRef.current) {
        callIdRef.current = message.callId
        saveCallSession({ ...callIntent, callId: message.callId })
      }

      if (message.signalType === 'GROUP_STARTED') {
        callIdRef.current = message.callId
        saveCallSession({ ...callIntent, callId: message.callId })
        setCallStatus('waiting')
        setStatusText('Đang chờ thành viên tham gia...')
        return
      }

      if (message.signalType === 'GROUP_JOIN_ACK') {
        await connectToParticipants(message.participants || [])
        return
      }

      if (message.signalType === 'GROUP_PARTICIPANT_JOINED' && message.participant) {
        participantsRef.current[message.participant.userId] = message.participant
        updateParticipants()
        return
      }

      if (message.signalType === 'GROUP_PEER_OFFER' && message.senderId && message.sdp) {
        if (!participantsRef.current[message.senderId]) {
          participantsRef.current[message.senderId] = { userId: message.senderId }
          updateParticipants()
        }

        const answerSdp = await meshRef.current.handlePeerOffer(
          message.senderId,
          message.sdp,
          localStreamRef.current,
          isVideoCall,
        )

        publishGroupPeerAnswer({
          callId: callIdRef.current,
          targetUserId: message.senderId,
          sdp: answerSdp,
        })

        setCallStatus('connected')
        setStatusText('Cuộc gọi nhóm đã kết nối')
        setCallStartedAt((prev) => prev || Date.now())
        return
      }

      if (message.signalType === 'GROUP_PEER_ANSWER' && message.senderId && message.sdp) {
        await meshRef.current.handlePeerAnswer(message.senderId, message.sdp)
        return
      }

      if (message.candidate && message.senderId && message.receiverId === user.id) {
        await meshRef.current.addIceCandidate(message.senderId, {
          candidate: message.candidate,
          sdpMid: message.sdpMid,
          sdpMLineIndex: message.sdpMLineIndex,
        })
        return
      }

      if (message.signalType === 'GROUP_PARTICIPANT_LEFT' && message.userId) {
        delete participantsRef.current[message.userId]
        removeRemoteStream(message.userId)
        updateParticipants()
        return
      }

      if (message.signalType === 'GROUP_END' || message.status === 'COMPLETED') {
        finishCall(message)
      }
    }

    const initialize = async () => {
      try {
        meshRef.current = createGroupMeshManager({
          onRemoteStream: setRemoteStream,
          onRemoteStreamRemoved: removeRemoteStream,
          onIceCandidate: sendIceCandidate,
        })

        await connect()
        if (!mounted) return

        removeListener = subscribe('/user/queue/call', handleMessage)

        const localStream = await getLocalStream(isVideoCall ? 'VIDEO' : 'AUDIO')
        if (!mounted) return

        const streamHasVideo = localStream.getVideoTracks().length > 0
        setHasVideoTrack(streamHasVideo)
        if (!streamHasVideo || !isVideoCall) setIsCamOn(false)

        localStreamRef.current = localStream
        if (isVideoCall && streamHasVideo) {
          setLocalPreviewStream(localStream)
        }

        if (isHost) {
          const published = publishGroupCallOffer({
            conversationId: callIntent.conversationId,
            type: callIntent.type || 'VIDEO',
          })
          if (!published) throw new Error('Không thể bắt đầu cuộc gọi nhóm')
          setCallStatus('waiting')
          setStatusText('Đang mời thành viên tham gia...')
        } else {
          callIdRef.current = callIntent.callId
          const published = publishGroupCallJoin(callIntent.callId)
          if (!published) throw new Error('Không thể tham gia cuộc gọi nhóm')
          setCallStatus('connecting')
          setStatusText('Đang tham gia cuộc gọi nhóm...')
        }
      } catch (error) {
        console.error('Failed to initialize group call:', error)
        setCallStatus('ended')
        setStatusText(error.message || 'Không thể khởi tạo cuộc gọi nhóm')
      }
    }

    initialize()

    return () => {
      mounted = false
      removeListener?.()
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      meshRef.current?.closeAll?.()
    }
  }, [callIntent, isHost, isVideoCall, navigate, user?.id])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTrack = (kind, enabled) => {
    localStreamRef.current?.getTracks?.().forEach((track) => {
      if (track.kind === kind) track.enabled = enabled
    })
  }

  const handleEndCall = async () => {
    selfEndedRef.current = true
    try {
      if (callIdRef.current) {
        if (isHost) {
          publishGroupCallEnd(callIdRef.current)
        } else {
          publishGroupCallLeave(callIdRef.current)
        }
      }
    } finally {
      localStreamRef.current?.getTracks?.().forEach((track) => track.stop())
      meshRef.current?.closeAll?.()
      clearCallSession()
      navigate('/chat', { replace: true })
    }
  }

  const remoteEntries = Object.entries(remoteStreams)
  const participantCount = Object.keys(participants).length + 1
  const localLabel = user?.displayName || user?.email || 'Bạn'

  if (!callIntent) return null

  const gridClass = remoteEntries.length <= 1
    ? 'grid-cols-1'
    : remoteEntries.length <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3'

  return (
    <div className="bg-[#0f0f13] h-screen w-screen overflow-hidden text-white font-sans relative">
      <header className="absolute top-0 left-0 w-full pt-10 flex flex-col items-center z-20 px-4">
        <div className="bg-white/10 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 flex flex-col items-center shadow-2xl">
          <h1 className="text-sm font-bold tracking-tight">{groupName}</h1>
          <span className="text-[10px] font-bold text-primary-fixed-dim tracking-[0.2em]">
            {isVideoCall ? 'Gọi video nhóm' : 'Gọi thoại nhóm'} · {formatTime(timer)}
          </span>
          <span className="text-[10px] text-white/50 mt-1">{participantCount} người · {statusText}</span>
        </div>
      </header>

      {isVideoCall ? (
        <div className={`absolute inset-0 z-0 p-4 pt-28 pb-36 grid ${gridClass} gap-3 overflow-y-auto`}>
          {remoteEntries.length === 0 && (
            <div className="col-span-full flex items-center justify-center text-white/40 text-sm">
              Đang chờ thành viên tham gia...
            </div>
          )}
          {remoteEntries.map(([userId, stream]) => {
            const info = participants[userId]
            return (
              <RemoteVideoTile
                key={userId}
                stream={stream}
                name={participantLabel(info, userId)}
                avatar={participantAvatar(info, userId)}
              />
            )
          })}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 pt-28 pb-36 px-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10">
              <img
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(localLabel)}`}
                alt={localLabel}
                className="w-20 h-20 rounded-full object-cover"
              />
              <span className="text-xs font-semibold">{localLabel} (Bạn)</span>
            </div>
            {Object.keys(participants).map((userId) => {
              const info = participants[userId]
              const hasAudio = Boolean(remoteStreams[userId])
              return (
                <div key={userId} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10">
                  <img
                    src={participantAvatar(info, userId)}
                    alt={participantLabel(info, userId)}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-center">{participantLabel(info, userId)}</span>
                  <span className="text-[10px] text-white/40">{hasAudio ? 'Đang nói' : 'Đang kết nối...'}</span>
                  {remoteStreams[userId] && (
                    <audio autoPlay playsInline ref={(el) => el && attachStreamToVideo(el, remoteStreams[userId])} className="hidden" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isVideoCall && (
        <div className="absolute bottom-32 right-8 z-30 w-40 aspect-[4/3] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#1e1e2e]">
          {isCamOn && hasVideoTrack ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-white/20">videocam_off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded-lg">
            {localLabel}
          </div>
        </div>
      )}

      {showPeople && (
        <div className="absolute right-8 top-28 z-40 w-64 max-h-80 overflow-y-auto rounded-2xl bg-black/80 border border-white/10 p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Thành viên</p>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
            <span className="text-sm">{localLabel} (Bạn)</span>
          </div>
          {Object.entries(participants).map(([userId, info]) => (
            <div key={userId} className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
              <img src={participantAvatar(info, userId)} alt="" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm truncate">{participantLabel(info, userId)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-10 left-0 w-full flex justify-center z-40 px-6">
        <div className="bg-white/10 backdrop-blur-3xl rounded-[32px] p-4 flex items-center gap-4 border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              const next = !isMicOn
              setIsMicOn(next)
              toggleTrack('audio', next)
            }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <span className="material-symbols-outlined">{isMicOn ? 'mic' : 'mic_off'}</span>
          </button>

          {isVideoCall && (
            <button
              type="button"
              onClick={() => {
                const next = !isCamOn
                setIsCamOn(next)
                toggleTrack('video', next)
              }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCamOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
            >
              <span className="material-symbols-outlined">{isCamOn ? 'videocam' : 'videocam_off'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPeople((open) => !open)}
            className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined">group</span>
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="h-14 px-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-3 transition-all shadow-xl shadow-red-500/20"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span>{isHost ? 'Kết thúc' : 'Rời cuộc gọi'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function RemoteVideoTile({ stream, name, avatar }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!stream || !videoRef.current) return undefined
    attachStreamToVideo(videoRef.current, stream)
    return undefined
  }, [stream])

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#1e1e2e] border border-white/10 min-h-[180px]">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover bg-black min-h-[180px]" />
      ) : (
        <div className="w-full h-full min-h-[180px] flex items-center justify-center">
          <img src={avatar} alt={name} className="w-20 h-20 rounded-full object-cover" />
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
        {name}
      </div>
    </div>
  )
}
