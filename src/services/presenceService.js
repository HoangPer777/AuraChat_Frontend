import api from './api'

export async function getPresenceStatus(userId) {
  if (!userId) return null

  const response = await api.get(`/presence/status/${userId}`)
  return response.data?.success ? response.data.data : null
}

export async function getFriendsPresence(friendIds) {
  const uniqueIds = [...new Set(friendIds.filter(Boolean))]
  if (uniqueIds.length === 0) return []

  const results = await Promise.allSettled(
    uniqueIds.map((userId) => getPresenceStatus(userId))
  )

  return results
    .filter((result) => result.status === 'fulfilled' && result.value?.userId)
    .map((result) => result.value)
}
