const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
]

// Public test relay — đủ cho demo/xuyên mạng; production nên dùng TURN riêng qua env.
const DEFAULT_TURN_SERVERS = [
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
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

  const turnUrl = import.meta.env.VITE_TURN_URL?.trim()
  const turnUsername = import.meta.env.VITE_TURN_USERNAME?.trim()
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL?.trim()

  const servers = DEFAULT_STUN_SERVERS.map((urls) => ({ urls }))

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl.split(',').map((item) => item.trim()).filter(Boolean),
      username: turnUsername,
      credential: turnCredential,
    })
    return servers
  }

  return [...servers, ...DEFAULT_TURN_SERVERS]
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
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  }
}
