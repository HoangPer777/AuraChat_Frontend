import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '../config/firebase'
import { registerFcmToken } from '../services/notificationService'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'
import { showBrowserNotification } from '../utils/browserNotification'

export default function usePushNotification() {
  const { accessToken } = useAuthStore()
  const pushEnabled = useNotificationStore((s) => s.pushEnabled)
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled)
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

      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
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
  }, [accessToken, addNotification, pushEnabled, setPushEnabled])
}
