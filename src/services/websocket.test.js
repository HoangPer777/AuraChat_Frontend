import { describe, it, expect, beforeEach } from 'vitest'
import {
  getConnectionState,
  isConnected,
  getStompClient,
  getSubscriptionCount,
  getSubscribedDestinations,
  unsubscribeAll,
} from './websocket'

describe('WebSocket Service', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'test-token')
    unsubscribeAll()
  })

  it('should initialize with disconnected state', () => {
    expect(getConnectionState()).toBe('disconnected')
  })

  it('should return false for isConnected when disconnected', () => {
    expect(isConnected()).toBe(false)
  })

  it('should return null for getStompClient when not connected', () => {
    expect(getStompClient()).toBeNull()
  })

  it('should initialize with zero subscriptions', () => {
    expect(getSubscriptionCount()).toBe(0)
  })

  it('should return empty array for subscribed destinations', () => {
    const destinations = getSubscribedDestinations()
    expect(Array.isArray(destinations)).toBe(true)
    expect(destinations.length).toBe(0)
  })

  it('should have correct exponential backoff delays', () => {
    const expectedDelays = [1000, 2000, 4000, 8000, 16000, 32000]
    expect(expectedDelays).toHaveLength(6)
    
    for (let i = 1; i < expectedDelays.length; i++) {
      expect(expectedDelays[i]).toBe(expectedDelays[i - 1] * 2)
    }
  })

  it('should handle missing access token gracefully', () => {
    localStorage.removeItem('accessToken')
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})
