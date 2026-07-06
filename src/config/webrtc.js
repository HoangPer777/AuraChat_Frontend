/**
 * WebRTC cấu hình tối ưu cho mạng LAN (cùng Wi‑Fi).
 * P2P trực tiếp qua host/srflx candidate — không dùng TURN relay (nhanh hơn, ít trễ).
 */

const LAN_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function parseIceServersFromEnv(rawValue) {
  if (!rawValue?.trim()) return null

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function getIceServers() {
  const fromEnv = parseIceServersFromEnv(import.meta.env.VITE_ICE_SERVERS)
  if (fromEnv?.length) {
    return fromEnv
  }

  return LAN_STUN_SERVERS
}

export function createRemoteMediaStream() {
  const stream = new MediaStream()

  return {
    addFromTrackEvent(event) {
      const track = event?.track
      if (!track) return stream

      if (!stream.getTracks().some((existing) => existing.id === track.id)) {
        stream.addTrack(track)
      }

      return stream
    },
    getStream() {
      return stream
    },
  }
}

export function getPeerConnectionConfig() {
  return {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 4,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
  }
}

/** Chờ ICE gathering — timeout ngắn hơn vì LAN thường gather nhanh. */
export function waitForIceGatheringComplete(peerConnection, timeoutMs = 4000) {
  if (!peerConnection || peerConnection.iceGatheringState === 'complete') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs)

    const onStateChange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        window.clearTimeout(timeout)
        peerConnection.removeEventListener('icegatheringstatechange', onStateChange)
        resolve()
      }
    }

    peerConnection.addEventListener('icegatheringstatechange', onStateChange)
  })
}
