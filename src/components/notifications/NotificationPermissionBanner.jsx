import React from 'react'
import useNotificationStore from '../../store/notificationStore'
import {
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
} from '../../utils/browserNotification'

export default function NotificationPermissionBanner() {
  const browserPermission = useNotificationStore((s) => s.browserPermission)
  const pushEnabled = useNotificationStore((s) => s.pushEnabled)
  const setBrowserPermission = useNotificationStore((s) => s.setBrowserPermission)
  const setPushEnabled = useNotificationStore((s) => s.setPushEnabled)

  if (!isBrowserNotificationSupported()) return null
  if (browserPermission === 'granted' && pushEnabled) return null
  if (browserPermission === 'denied') {
    return (
      <div className="mx-4 mt-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        Thông báo trình duyệt đang bị chặn. Hãy bật lại trong cài đặt trình duyệt để nhận tin nhắn và cuộc gọi khi tab ẩn.
      </div>
    )
  }

  const handleEnable = async () => {
    const permission = await requestBrowserNotificationPermission()
    setBrowserPermission(permission)
    if (permission === 'granted') {
      setPushEnabled(true)
    }
  }

  return (
    <div className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-on-surface">Bật thông báo</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Nhận tin nhắn, lời mời kết bạn và cuộc gọi ngay cả khi tab không active.
        </p>
      </div>
      <button
        type="button"
        onClick={handleEnable}
        className="shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90"
      >
        Bật ngay
      </button>
    </div>
  )
}
