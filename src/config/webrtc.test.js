import { describe, expect, it, beforeAll } from 'vitest'
import { createRemoteMediaStream, getIceServers } from './webrtc'

beforeAll(() => {
  class MockMediaStream {
    constructor(tracks = []) {
      this._tracks = [...tracks]
    }

    addTrack(track) {
      if (!this._tracks.some((existing) => existing.id === track.id)) {
        this._tracks.push(track)
      }
    }

    getTracks() {
      return [...this._tracks]
    }

    getAudioTracks() {
      return this._tracks.filter((track) => track.kind === 'audio')
    }

    getVideoTracks() {
      return this._tracks.filter((track) => track.kind === 'video')
    }
  }

  globalThis.MediaStream = MockMediaStream
})

describe('getIceServers', () => {
  it('uses STUN only for LAN-optimized peer connections', () => {
    const servers = getIceServers()

    expect(servers.some((server) => String(server.urls).includes('stun:'))).toBe(true)
    expect(servers.some((server) => String(server.urls).includes('turn:'))).toBe(false)
  })
})

describe('createRemoteMediaStream', () => {
  it('collects tracks when ontrack has no streams array', () => {
    const remote = createRemoteMediaStream()
    const audioTrack = { kind: 'audio', id: 'audio-1', readyState: 'live', enabled: true }
    const videoTrack = { kind: 'video', id: 'video-1', readyState: 'live', enabled: true }

    remote.addFromTrackEvent({ track: audioTrack, streams: [] })
    remote.addFromTrackEvent({ track: videoTrack, streams: [] })

    const stream = remote.getStream()
    expect(stream.getAudioTracks()).toHaveLength(1)
    expect(stream.getVideoTracks()).toHaveLength(1)
  })

  it('does not duplicate tracks from repeated ontrack events', () => {
    const remote = createRemoteMediaStream()
    const audioTrack = { kind: 'audio', id: 'audio-1', readyState: 'live', enabled: true }

    remote.addFromTrackEvent({ track: audioTrack, streams: [] })
    remote.addFromTrackEvent({ track: audioTrack, streams: [] })

    expect(remote.getStream().getAudioTracks()).toHaveLength(1)
  })
})
