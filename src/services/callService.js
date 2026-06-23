import { send } from './websocket'

export function createPeerConnection({ onTrack, onIceCandidate, onConnectionStateChange }) {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  })

  peerConnection.ontrack = (event) => {
    onTrack?.(event)
  }

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate)
    }
  }

  peerConnection.onconnectionstatechange = () => {
    onConnectionStateChange?.(peerConnection.connectionState)
  }

  return peerConnection
}

export async function getLocalStream(kind = 'VIDEO') {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Trình duyệt không hỗ trợ camera hoặc microphone.')
  }

  const videoConstraints = {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 480 },
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
  if (!videoEl || !stream) return

  if (videoEl.srcObject !== stream) {
    videoEl.srcObject = stream
  }

  try {
    await videoEl.play()
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('Video preview play failed:', error)
    }
  }
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
