import { createPeerConnection } from '../services/callService'
import { createRemoteMediaStream } from '../config/webrtc'

export function createGroupMeshManager({
  onRemoteStream,
  onRemoteStreamRemoved,
  onIceCandidate,
}) {
  const peerConnections = new Map()
  const pendingRemoteCandidates = new Map()
  const remoteStreams = new Map()

  const getRemoteStream = (remoteUserId) => {
    if (!remoteStreams.has(remoteUserId)) {
      remoteStreams.set(remoteUserId, createRemoteMediaStream())
    }
    return remoteStreams.get(remoteUserId)
  }

  const getPending = (remoteUserId) => {
    if (!pendingRemoteCandidates.has(remoteUserId)) {
      pendingRemoteCandidates.set(remoteUserId, [])
    }
    return pendingRemoteCandidates.get(remoteUserId)
  }

  const ensurePeerConnection = (remoteUserId, localStream, isVideoCall) => {
    if (peerConnections.has(remoteUserId)) {
      return peerConnections.get(remoteUserId)
    }

    const peerConnection = createPeerConnection({
      onTrack: (event) => {
        const remote = getRemoteStream(remoteUserId)
        remote.addFromTrackEvent(event)
        onRemoteStream?.(remoteUserId, new MediaStream(remote.getStream().getTracks()))
      },
      onIceCandidate: (candidate) => {
        onIceCandidate?.(remoteUserId, candidate)
      },
      onConnectionStateChange: (state) => {
        if (state === 'failed' || state === 'closed') {
          onRemoteStreamRemoved?.(remoteUserId)
        }
      },
    })

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
      })
    }

    peerConnections.set(remoteUserId, peerConnection)
    getPending(remoteUserId)
    return peerConnection
  }

  const flushRemoteCandidates = async (remoteUserId) => {
    const peerConnection = peerConnections.get(remoteUserId)
    if (!peerConnection?.remoteDescription) return

    const queue = getPending(remoteUserId)
    while (queue.length > 0) {
      const candidate = queue.shift()
      try {
        await peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.warn('Failed to add buffered ICE candidate:', error)
      }
    }
  }

  return {
    hasPeerConnection(remoteUserId) {
      return peerConnections.has(remoteUserId)
    },

    async createOfferToPeer(remoteUserId, localStream, isVideoCall) {
      const peerConnection = ensurePeerConnection(remoteUserId, localStream, isVideoCall)
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      })
      await peerConnection.setLocalDescription(offer)
      return offer.sdp
    },

    async handlePeerOffer(remoteUserId, sdp, localStream, isVideoCall) {
      const peerConnection = ensurePeerConnection(remoteUserId, localStream, isVideoCall)
      await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      await flushRemoteCandidates(remoteUserId)
      return answer.sdp
    },

    async handlePeerAnswer(remoteUserId, sdp) {
      const peerConnection = peerConnections.get(remoteUserId)
      if (!peerConnection) return
      await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
      await flushRemoteCandidates(remoteUserId)
    },

    async addIceCandidate(remoteUserId, candidateInit) {
      const peerConnection = peerConnections.get(remoteUserId)
      const iceCandidate = new RTCIceCandidate(candidateInit)

      if (!peerConnection?.remoteDescription) {
        getPending(remoteUserId).push(iceCandidate)
        return
      }

      await peerConnection.addIceCandidate(iceCandidate).catch((error) => {
        console.warn('Failed to add ICE candidate:', error)
      })
    },

    closeAll() {
      peerConnections.forEach((peerConnection) => peerConnection.close())
      peerConnections.clear()
      pendingRemoteCandidates.clear()
      remoteStreams.clear()
    },
  }
}
