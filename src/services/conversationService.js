import api from './api'

export async function createGroupConversation(name, memberIds) {
  const response = await api.post('/conversations', {
    type: 'GROUP',
    name: name.trim(),
    memberIds,
  })
  return response.data
}

export async function getConversation(conversationId) {
  const response = await api.get(`/conversations/${conversationId}`)
  return response.data
}

export async function addGroupMember(conversationId, userId) {
  const response = await api.post(`/conversations/${conversationId}/members`, { userId })
  return response.data
}

export async function removeGroupMember(conversationId, userId) {
  const response = await api.delete(`/conversations/${conversationId}/members/${userId}`)
  return response.data
}

export async function updateGroupConversation(conversationId, payload) {
  const response = await api.patch(`/conversations/${conversationId}`, payload)
  return response.data
}

export async function uploadGroupAvatar(conversationId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/conversations/${conversationId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function leaveGroup(conversationId, currentUserId) {
  return removeGroupMember(conversationId, currentUserId)
}
