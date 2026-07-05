import api from './api'

const unwrap = (response) => response.data?.data ?? response.data

export const getAdminUsers = async (params) => unwrap(await api.get('/admin/users', { params }))
export const getAdminUser = async (id) => unwrap(await api.get(`/admin/users/${id}`))
export const updateAdminUser = async (id, payload) => unwrap(await api.patch(`/admin/users/${id}`, payload))
export const deactivateUser = async (id) => unwrap(await api.post(`/admin/users/${id}/deactivate`))
export const activateUser = async (id) => unwrap(await api.post(`/admin/users/${id}/activate`))
export const terminateUser = async (id) => unwrap(await api.post(`/admin/users/${id}/terminate`))
export const getAdminStatistics = async (params) => unwrap(await api.get('/admin/statistics', { params }))
export const getBannedIps = async (params) => unwrap(await api.get('/admin/banned-ips', { params }))
export const banIp = async (payload) => unwrap(await api.post('/admin/ban-ip', payload))
export const unbanIp = async (ipAddress) => unwrap(await api.delete(`/admin/ban-ip/${encodeURIComponent(ipAddress)}`))

export const getAdminMedia = async (params) => unwrap(await api.get('/admin/media', { params }))
export const getAdminMediaStats = async () => unwrap(await api.get('/admin/media/stats'))
export const getAdminMediaDetail = async (id) => unwrap(await api.get(`/admin/media/${id}`))
export const deleteAdminMedia = async (id) => unwrap(await api.delete(`/admin/media/${id}`))

export const getAdminPosts = async (params) => unwrap(await api.get('/admin/posts', { params }))
export const getAdminPost = async (id) => unwrap(await api.get(`/admin/posts/${id}`))
export const getAdminPostComments = async (id, params) => unwrap(await api.get(`/admin/posts/${id}/comments`, { params }))
export const deleteAdminPost = async (id) => unwrap(await api.delete(`/admin/posts/${id}`))
export const deleteAdminComment = async (commentId) => unwrap(await api.delete(`/admin/posts/comments/${commentId}`))

export const getModerationFlags = async (params) => unwrap(await api.get('/admin/moderation/flags', { params }))
export const getModerationStats = async () => unwrap(await api.get('/admin/moderation/flags/stats'))
export const dismissModerationFlag = async (id, note) => unwrap(await api.post(`/admin/moderation/flags/${id}/dismiss`, note ? { note } : {}))
export const removeModerationContent = async (id, note) => unwrap(await api.post(`/admin/moderation/flags/${id}/remove-content`, note ? { note } : {}))
export const warnModerationUser = async (id, message) => unwrap(await api.post(`/admin/moderation/flags/${id}/warn-user`, { message }))
export const flagModerationMedia = async (mediaId, note) => unwrap(await api.post(`/admin/moderation/media/${mediaId}/flag`, note ? { note } : {}))
export const getModerationKeywords = async () => unwrap(await api.get('/admin/moderation/keywords'))
export const addModerationKeyword = async (word) => unwrap(await api.post('/admin/moderation/keywords', { word }))
export const deleteModerationKeyword = async (id) => unwrap(await api.delete(`/admin/moderation/keywords/${id}`))
