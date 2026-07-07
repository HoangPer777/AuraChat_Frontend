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

export async function countVideoInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return null

  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput').length
}

export async function requestLocalVideoTrack() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Trình duyệt không hỗ trợ camera.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  const track = stream.getVideoTracks()[0]

  if (!track) {
    stream.getTracks().forEach((item) => item.stop())
    throw new Error('Không tìm thấy camera trên thiết bị này.')
  }

  return track
}

export async function enableLocalVideoForCall(peerConnection, localStream) {
  if (!localStream) {
    throw new Error('Local stream chưa sẵn sàng.')
  }

  let videoTrack = localStream.getVideoTracks()[0]
  if (!videoTrack) {
    videoTrack = await requestLocalVideoTrack()
    localStream.addTrack(videoTrack)
  } else {
    videoTrack.enabled = true
  }

  const videoSender = peerConnection?.getSenders()?.find((sender) => sender.track?.kind === 'video')
  if (videoSender) {
    await videoSender.replaceTrack(videoTrack)
    return { videoTrack, renegotiateRequired: false }
  }

  const videoTransceiver = peerConnection?.getTransceivers()?.find(
    (transceiver) => transceiver.sender?.track?.kind === 'video'
      || transceiver.receiver?.track?.kind === 'video'
      || transceiver.direction === 'recvonly',
  )

  if (videoTransceiver) {
    await videoTransceiver.sender.replaceTrack(videoTrack)
    videoTransceiver.direction = 'sendrecv'
    return { videoTrack, renegotiateRequired: true }
  }

  if (peerConnection) {
    peerConnection.addTrack(videoTrack, localStream)
    return { videoTrack, renegotiateRequired: true }
  }

  return { videoTrack, renegotiateRequired: false }
}

export async function createRenegotiationOffer(peerConnection) {
  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  return peerConnection.localDescription?.sdp || offer.sdp
}

export async function applyRenegotiationOffer(peerConnection, sdp) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  return peerConnection.localDescription?.sdp || answer.sdp
}

export async function applyRenegotiationAnswer(peerConnection, sdp) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
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

  // Thử constraint đơn giản trước — desktop/mobile đều tương thích
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  } catch {
    // fall through
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

export async function attachStreamToVideo(videoEl, stream, options = {}) {
  if (!videoEl || !stream) return false

  const { muted = false } = options
  videoEl.muted = muted

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

export function attachRemoteCallMedia(stream, { videoEl, audioEl } = {}) {
  if (!stream) return

  const videoTracks = stream.getVideoTracks()
  const audioTracks = stream.getAudioTracks()

  if (videoEl && videoTracks.length > 0) {
    attachStreamToVideo(videoEl, new MediaStream(videoTracks), { muted: true })
  }

  if (audioEl && audioTracks.length > 0) {
    attachStreamToVideo(audioEl, new MediaStream(audioTracks), { muted: false })
  }
}

export function attachLocalTracks(peerConnection, localStream) {
  if (!peerConnection || !localStream) return

  localStream.getTracks().forEach((track) => {
    const existing = peerConnection.getSenders().find((sender) => sender.track?.kind === track.kind)
    if (existing) {
      existing.replaceTrack(track).catch(() => {
        peerConnection.addTrack(track, localStream)
      })
      return
    }
    peerConnection.addTrack(track, localStream)
  })
}

export function setupVideoCallPeerConnection(peerConnection, localStream, isVideoCall) {
  if (!isVideoCall) {
    attachLocalTracks(peerConnection, localStream)
    return
  }

  const hasLocalVideo = localStream.getVideoTracks().length > 0
  attachLocalTracks(peerConnection, localStream)

  const hasVideoSender = peerConnection.getSenders().some((sender) => sender.track?.kind === 'video')
  if (!hasLocalVideo && !hasVideoSender) {
    peerConnection.addTransceiver('video', { direction: 'recvonly' })
  }
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

export function publishCallRenegotiate(payload) {
  return send('/app/call/renegotiate', payload)
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
