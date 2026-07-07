/**
 * Mobile / in-app browsers thường chặn popup OAuth.
 * Dùng redirect thay popup để đăng nhập Google/Facebook ổn định hơn.
 */
export function shouldPreferOAuthRedirect() {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches

  return isMobileUa || (isTouchDevice && isSmallScreen)
}

export function isPopupBlockedError(error) {
  const code = error?.code || ''
  return code === 'auth/popup-blocked'
    || code === 'auth/operation-not-supported-in-this-environment'
}
