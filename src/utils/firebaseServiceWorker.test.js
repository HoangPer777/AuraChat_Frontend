import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerFirebaseServiceWorker, waitForServiceWorkerActivation } from './firebaseServiceWorker'

function createMockWorker(state = 'installing') {
  const listeners = new Map()
  return {
    state,
    addEventListener: (event, handler) => {
      listeners.set(event, handler)
    },
    removeEventListener: (event) => {
      listeners.delete(event)
    },
    emit: (event) => {
      listeners.get(event)?.()
    },
  }
}

describe('firebaseServiceWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resolves immediately when registration is already active', async () => {
    const registration = { active: { state: 'activated' } }
    await expect(waitForServiceWorkerActivation(registration)).resolves.toBe(registration)
  })

  it('waits until installing worker becomes activated', async () => {
    const worker = createMockWorker('installing')
    const registration = { active: null, installing: worker }

    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(registration) },
    })

    const promise = waitForServiceWorkerActivation(registration, 5000)

    worker.state = 'activated'
    worker.emit('statechange')

    await expect(promise).resolves.toBe(registration)
  })

  it('registers firebase messaging service worker and waits until ready', async () => {
    const activeRegistration = { active: { state: 'activated' } }
    const register = vi.fn().mockResolvedValue(activeRegistration)
    const ready = Promise.resolve(activeRegistration)

    vi.stubGlobal('navigator', {
      serviceWorker: { register, ready },
    })

    await expect(registerFirebaseServiceWorker()).resolves.toBe(activeRegistration)
    expect(register).toHaveBeenCalledWith('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  })
})
