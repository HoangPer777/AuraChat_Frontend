import api from './api'

export async function registerFcmToken(token) {
  const response = await api.post('/auth/me/fcm-token', { token })
  return response.data
}

export async function removeFcmToken(token) {
  const response = await api.delete('/auth/me/fcm-token', { data: { token } })
  return response.data
}
