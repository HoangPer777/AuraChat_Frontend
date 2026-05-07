import axios from 'axios'
import useAuthStore from '../store/authStore'

/**
 * API Service with Axios
 * 
 * Features:
 * - Automatic access token injection in request headers
 * - Automatic token refresh on 401 response
 * - Request queuing during token refresh
 * - Queue processing after successful refresh
 * - Redirect to login on refresh failure
 * 
 * Requirements: 11 (Access Token Refresh), 24 (API Integration and Error Handling)
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
})

// Token refresh state management
let isRefreshing = false
let failedQueue = []

/**
 * Process queued requests after token refresh
 * 
 * @param {Error|null} error - Error if refresh failed, null if successful
 * @param {string|null} token - New access token if refresh successful
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

/**
 * Request Interceptor: Add access token to Authorization header
 * Requirement 11: Include access token in all API requests
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Response Interceptor: Handle 401 errors with automatic token refresh
 * 
 * Flow:
 * 1. On 401 response, check if refresh is already in progress
 * 2. If not, initiate token refresh with refresh token
 * 3. Queue all subsequent requests during refresh
 * 4. On successful refresh, update tokens and retry queued requests
 * 5. On refresh failure, clear auth and redirect to login
 * 
 * Requirement 11: Automatic token refresh on 401 response
 * Requirement 11: Request queuing during token refresh
 * Requirement 11: Queue processing after successful refresh
 */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Only handle 401 errors that haven't been retried
    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken')

      // No refresh token available - redirect to login
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(err)
      }

      // If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      // Mark as retry and start refresh
      original._retry = true
      isRefreshing = true

      try {
        // Refresh token using axios directly to avoid interceptor loop
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        )

        const newAccessToken = data.accessToken
        const newRefreshToken = data.refreshToken

        // Update tokens in localStorage
        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update auth store
        const { setAccessToken } = useAuthStore.getState()
        setAccessToken(newAccessToken)

        // Update API instance default header
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

        // Process queued requests with new token
        processQueue(null, newAccessToken)

        // Retry original request with new token
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      } catch (refreshErr) {
        // Token refresh failed - clear auth and redirect to login
        processQueue(refreshErr, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
