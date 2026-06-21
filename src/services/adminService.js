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
