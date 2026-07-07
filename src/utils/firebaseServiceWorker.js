const DEFAULT_SW_URL = '/firebase-messaging-sw.js'
const ACTIVATION_TIMEOUT_MS = 15000

export function waitForServiceWorkerActivation(registration, timeoutMs = ACTIVATION_TIMEOUT_MS) {
  if (!registration) {
    return Promise.reject(new Error('Service worker registration is required'))
  }

  if (registration.active) {
    return Promise.resolve(registration)
  }

  const worker = registration.installing || registration.waiting
  if (!worker) {
    return navigator.serviceWorker.ready
  }

  if (worker.state === 'activated') {
    return Promise.resolve(registration)
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Service worker activation timeout'))
    }, timeoutMs)

    const onStateChange = () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout)
        worker.removeEventListener('statechange', onStateChange)
        resolve(registration)
      }

      if (worker.state === 'redundant') {
        window.clearTimeout(timeout)
        worker.removeEventListener('statechange', onStateChange)
        reject(new Error('Service worker became redundant'))
      }
    }

    worker.addEventListener('statechange', onStateChange)
  }).then(() => navigator.serviceWorker.ready)
}

export async function registerFirebaseServiceWorker(swUrl = DEFAULT_SW_URL) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  const registration = await navigator.serviceWorker.register(swUrl, {
    scope: '/',
    updateViaCache: 'none',
  })

  await waitForServiceWorkerActivation(registration)
  return navigator.serviceWorker.ready
}
