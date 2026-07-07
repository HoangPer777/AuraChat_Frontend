import { getPeerConnectionConfig } from '../config/webrtc'
import { send } from './websocket'

export function createPeerConnection({ onTrack, onIceCandidate, onConnectionStateChange, onIceConnectionStateChange }) {
  const peerConnection = new RTCPeerConnection(getPeerConnectionConfig())

  peerConnection.addEventListener('track', (event) => {
    onTrack?.(event)
  })

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate)
    }
  }

  peerConnection.onconnectionstatechange = () => {
    onConnectionStateChange?.(peerConnection.connectionState)
  }

  peerConnection.oniceconnectionstatechange = () => {
    const state = peerConnection.iceConnectionState
    onIceConnectionStateChange?.(state)

    if (state === 'failed') {
      try {
        peerConnection.restartIce()
      } catch (error) {
        console.warn('ICE restart failed:', error)
      }
    }
  }

  return peerConnection
}

export async function getLocalStream(kind = 'VIDEO') {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Trình duyệt không hỗ trợ camera hoặc microphone.')
  }

  const videoConstraints = {
    facingMode: 'user',
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
  }

  if (kind === 'AUDIO') {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: videoConstraints })
  } catch (error) {
    const recoverable = ['NotFoundError', 'NotReadableError', 'OverconstrainedError']
    if (recoverable.includes(error?.name)) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: 'user' },
        })
      } catch {
        // fall through to audio-only below
      }
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      } catch (audioError) {
        throw new Error('Không tìm thấy camera hoặc microphone. Hãy kiểm tra thiết bị và quyền truy cập.')
      }
    }

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      throw new Error('Bạn cần cho phép quyền camera/microphone để thực hiện cuộc gọi.')
    }

    throw error
  }
}

export async function attachStreamToVideo(videoEl, stream) {
  if (!videoEl || !stream) return false

  if (videoEl.srcObject !== stream) {
    videoEl.srcObject = stream
  }

  try {
    await videoEl.play()
    return true
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('Video preview play failed:', error)
    }
    return false
  }
}

export function attachLocalTracks(peerConnection, localStream) {
  if (!peerConnection || !localStream) return

  const senders = peerConnection.getSenders()
  localStream.getTracks().forEach((track) => {
    const existing = senders.find((sender) => sender.track?.kind === track.kind)
    if (existing) {
      existing.replaceTrack(track).catch((error) => {
        console.warn('replaceTrack failed, falling back to addTrack:', error)
        peerConnection.addTrack(track, localStream)
      })
      return
    }
    peerConnection.addTrack(track, localStream)
  })
}

export async function createVideoOffer(peerConnection) {
  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  return peerConnection.localDescription?.sdp || offer.sdp
}

export async function createVideoAnswer(peerConnection) {
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  return peerConnection.localDescription?.sdp || answer.sdp
}

export function publishCallOffer(payload) {
  return send('/app/call/offer', payload)
}

export function publishCallAnswer(payload) {
  return send('/app/call/answer', payload)
}

export function publishIceCandidate(payload) {
  return send('/app/call/ice-candidate', payload)
}

export function publishCallEnd({ callId, status = null }) {
  const payload = status ? { callId, status } : { callId }
  return send('/app/call/end', payload)
}

export function publishGroupCallOffer(payload) {
  return send('/app/call/group/offer', payload)
}

export function publishGroupCallJoin(callId) {
  return send('/app/call/group/join', { callId })
}

export function publishGroupPeerOffer({ callId, targetUserId, sdp }) {
  return send('/app/call/group/peer-offer', { callId, targetUserId, sdp })
}

export function publishGroupPeerAnswer({ callId, targetUserId, sdp }) {
  return send('/app/call/group/peer-answer', { callId, targetUserId, sdp })
}

export function publishGroupCallLeave(callId) {
  return send('/app/call/group/leave', { callId })
}

export function publishGroupCallEnd(callId) {
  return send('/app/call/group/end', { callId })
}

export function publishGroupCallDecline(callId) {
  return send('/app/call/group/decline', { callId })
}
