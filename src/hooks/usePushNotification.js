import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '../config/firebase'
import { registerFcmToken } from '../services/notificationService'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'
import { showBrowserNotification } from '../utils/browserNotification'
import { registerFirebaseServiceWorker } from '../utils/firebaseServiceWorker'

async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  return Notification.requestPermission()
}

export default function usePushNotification() {
  const { accessToken } = useAuthStore()
  const pushEnabled = useNotificationStore((s) => s.pushEnabled)
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled)
  const setBrowserPermission = useNotificationStore((s) => s.setBrowserPermission)
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!accessToken || !pushEnabled) return undefined

    let unsubscribe = null
    let active = true

    const setup = async () => {
      const messaging = await getFirebaseMessaging()
      if (!messaging || !active) return

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        console.warn('VITE_FIREBASE_VAPID_KEY chưa cấu hình — bỏ qua FCM push')
        return
      }

      const permission = await ensureNotificationPermission()
      setBrowserPermission(permission)
      if (permission !== 'granted') {
        console.warn('Notification permission chưa được cấp — bỏ qua FCM push')
        setPushEnabled(false)
        return
      }

      try {
        const registration = await registerFirebaseServiceWorker()
        if (!registration || !active) return

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        })

        if (token && active) {
          await registerFcmToken(token)
        }
      } catch (error) {
        console.warn('FCM token registration failed:', error)
        setPushEnabled(false)
      }

      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title || 'AuraChat'
        const body = payload.notification?.body || payload.data?.body || ''
        const type = payload.data?.type || 'SYSTEM'

        addNotification({
          type,
          title,
          message: body,
          route: payload.data?.route || '/notifications',
        })

        showBrowserNotification({
          title,
          body,
          tag: payload.data?.tag,
          data: payload.data,
          onClick: (data) => {
            if (data?.route) window.location.assign(data.route)
          },
        })
      })
    }

    if ('serviceWorker' in navigator) {
      setup()
    }

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [accessToken, addNotification, pushEnabled, setBrowserPermission, setPushEnabled])
}
