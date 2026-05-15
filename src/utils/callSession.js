const CALL_SESSION_KEY = 'aurachat_call_session'

export function saveCallSession(session) {
  sessionStorage.setItem(CALL_SESSION_KEY, JSON.stringify(session))
}

export function loadCallSession() {
  const raw = sessionStorage.getItem(CALL_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Failed to parse call session:', error)
    return null
  }
}

export function clearCallSession() {
  sessionStorage.removeItem(CALL_SESSION_KEY)
}
