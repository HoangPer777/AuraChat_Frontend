import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'

/** getRedirectResult chỉ trả kết quả 1 lần — StrictMode mount 2 lần sẽ làm lần 2 null. */
let redirectResultPromise = null

export function resolveFirebaseRedirectOnce() {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((error) => {
      redirectResultPromise = null
      throw error
    })
  }
  return redirectResultPromise
}

/** Khởi tạo sớm trước React render để tránh StrictMode consume mất redirect. */
export function bootstrapFirebaseRedirect() {
  resolveFirebaseRedirectOnce().catch(() => {})
}

export function waitForFirebaseAuthUser(timeoutMs = 8000) {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser)
  }

  return new Promise((resolve) => {
    let settled = false

    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      unsubscribe()
      resolve(auth.currentUser || null)
    }, timeoutMs)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      unsubscribe()
      resolve(user)
    })
  })
}

export async function resolveFirebaseUserAfterRedirect() {
  const redirectResult = await resolveFirebaseRedirectOnce()
  if (redirectResult?.user) {
    return redirectResult.user
  }

  return waitForFirebaseAuthUser()
}
