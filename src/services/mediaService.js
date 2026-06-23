import api from './api'

const buildFormData = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const uploadImage = async (file) => {
  const response = await api.post('/media/upload/image', buildFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const uploadFile = async (file) => {
  const response = await api.post('/media/upload/file', buildFormData(file), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const listMedia = async (params = { page: 0, size: 20 }) => {
  const response = await api.get('/media', { params })
  return response.data
}

export const getMediaDetail = async (mediaId) => {
  const response = await api.get(`/media/${mediaId}`)
  return response.data
}

export const deleteMedia = async (mediaId) => {
  const response = await api.delete(`/media/${mediaId}`)
  return response.data
}

export default {
  uploadImage,
  uploadFile,
  listMedia,
  getMediaDetail,
  deleteMedia,
}
