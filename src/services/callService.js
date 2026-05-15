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
  const constraints = kind === 'AUDIO'
    ? { audio: true, video: false }
    : { audio: true, video: true }

  return navigator.mediaDevices.getUserMedia(constraints)
}

export async function publishCallOffer(payload) {
  return send('/app/call/offer', payload)
}

export async function publishCallAnswer(payload) {
  return send('/app/call/answer', payload)
}

export async function publishIceCandidate(payload) {
  return send('/app/call/ice-candidate', payload)
}

export async function publishCallEnd(payload) {
  return send('/app/call/end', payload)
}
