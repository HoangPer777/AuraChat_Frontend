import api from './api'

export async function searchUsers(query) {
  const response = await api.get('/friends/search', {
    params: { q: query },
  })

  return response.data
}

export async function getFriends() {
  const response = await api.get('/friends')
  return response.data
}

export async function getPendingFriendRequests() {
  const response = await api.get('/friends/requests/pending')
  return response.data
}

export async function sendFriendRequest(receiverId) {
  const response = await api.post('/friends/request', { receiverId })
  return response.data
}

export async function acceptFriendRequest(id) {
  const response = await api.put(`/friends/requests/${id}/accept`)
  return response.data
}

export async function declineFriendRequest(id) {
  const response = await api.put(`/friends/requests/${id}/decline`)
  return response.data
}

export async function unfriend(friendId) {
  const response = await api.delete(`/friends/${friendId}`)
  return response.data
}
