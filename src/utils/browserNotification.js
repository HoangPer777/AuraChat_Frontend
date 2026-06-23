export function isBrowserNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestBrowserNotificationPermission() {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported'
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }

  return Notification.requestPermission()
}

export function shouldShowBrowserNotification() {
  if (!isBrowserNotificationSupported()) return false
  if (Notification.permission !== 'granted') return false
  return document.hidden || !document.hasFocus()
}

export function showBrowserNotification({
  title,
  body,
  icon,
  tag,
  onClick,
  data,
}) {
  if (!shouldShowBrowserNotification()) return null

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag: tag || undefined,
      data,
    })

    notification.onclick = (event) => {
      event.preventDefault()
      window.focus()
      onClick?.(notification.data)
      notification.close()
    }

    return notification
  } catch (error) {
    console.warn('Browser notification failed:', error)
    return null
  }
}

export function formatTimeAgo(value) {
  if (!value) return 'Vừa xong'

  const createdAt = new Date(value)
  const diffMs = Date.now() - createdAt.getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}
