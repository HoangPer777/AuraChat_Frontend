import api from './api'

export const createPost = async (payload) => {
  const response = await api.post('/posts', payload)
  return response.data
}

export const getFeed = async (params = { page: 0, size: 10 }) => {
  const response = await api.get('/posts/feed', { params })
  return response.data
}

export const getUserPosts = async (authorId, params = { page: 0, size: 10 }) => {
  const response = await api.get(`/posts/user/${authorId}`, { params })
  return response.data
}

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`)
  return response.data
}

export const toggleLike = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`)
  return response.data
}

export const getComments = async (postId, params = { page: 0, size: 20 }) => {
  const response = await api.get(`/posts/${postId}/comments`, { params })
  return response.data
}

export const addComment = async (postId, content) => {
  const response = await api.post(`/posts/${postId}/comments`, { content })
  return response.data
}

export const sharePost = async (postId, content = '') => {
  const response = await api.post(`/posts/${postId}/share`, { content })
  return response.data
}

export default {
  createPost,
  getFeed,
  getUserPosts,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  sharePost,
}
