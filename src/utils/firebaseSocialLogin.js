import api from '../services/api'
import { resolveFirebaseUserAfterRedirect } from './firebaseRedirectAuth'

/**
 * Hoàn tất đăng nhập Firebase OAuth → JWT backend.
 * Dùng cho redirect flow (mobile) sau khi quay lại /login.
 */
export async function completeFirebaseSocialLogin(firebaseUser) {
  if (!firebaseUser) return null

  const idToken = await firebaseUser.getIdToken()
  const response = await api.post('/auth/firebase/login', { idToken })

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Đăng nhập Firebase thất bại.')
  }

  return response.data.data
}

export async function handleFirebaseOAuthReturn() {
  const hasAppToken = Boolean(localStorage.getItem('accessToken'))
  if (hasAppToken) return null

  const firebaseUser = await resolveFirebaseUserAfterRedirect()
  if (!firebaseUser) return null

  return completeFirebaseSocialLogin(firebaseUser)
}
