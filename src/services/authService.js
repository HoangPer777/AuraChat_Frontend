import api from './api'
import useAuthStore from '../store/authStore'

/**
 * Authentication Service
 * 
 * Handles all authentication-related operations including:
 * - Firebase login with ID token
 * - Token and user data storage
 * - Token refresh
 * - Logout
 * - Authentication status checks
 * 
 * Requirements: 1, 2, 3, 11, 12 (Authentication flows)
 */

/**
 * Authenticate with Firebase ID token
 * Sends ID token to backend for verification and token exchange
 * 
 * @param {string} idToken - Firebase ID token from authentication
 * @returns {Promise<Object>} - Response with accessToken, refreshToken, and user data
 * @throws {Error} - If authentication fails
 */
export const firebaseLogin = async (idToken) => {
  try {
    const response = await api.post('/auth/firebase/login', { idToken })
    const { accessToken, refreshToken, user } = response.data
    
    // Store auth data
    storeAuthData({ accessToken, refreshToken, user })
    
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Firebase login failed')
  }
}

/**
 * Store authentication data in localStorage and auth store
 * 
 * @param {Object} authData - Authentication data object
 * @param {string} authData.accessToken - JWT access token
 * @param {string} authData.refreshToken - JWT refresh token
 * @param {Object} authData.user - User object with id, email, displayName, avatarUrl, bio
 */
export const storeAuthData = ({ accessToken, refreshToken, user }) => {
  const { setAuth } = useAuthStore.getState()
  setAuth(user, accessToken, refreshToken)
}

/**
 * Get current access token from localStorage
 * 
 * @returns {string|null} - Access token or null if not available
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}

/**
 * Get current refresh token from localStorage
 * 
 * @returns {string|null} - Refresh token or null if not available
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken')
}

/**
 * Get current user from auth store
 * 
 * @returns {Object|null} - User object or null if not authenticated
 */
export const getUser = () => {
  const { user } = useAuthStore.getState()
  return user
}

/**
 * Refresh access token using refresh token
 * Called when access token expires (401 response)
 * 
 * @returns {Promise<string>} - New access token
 * @throws {Error} - If refresh fails
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post('/auth/refresh', { refreshToken })
    const { accessToken, refreshToken: newRefreshToken } = response.data
    
    // Update tokens in localStorage and store
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
    
    const { setAccessToken } = useAuthStore.getState()
    setAccessToken(accessToken)
    
    return accessToken
  } catch (error) {
    // Clear auth on refresh failure
    logout()
    throw new Error(error.response?.data?.message || 'Token refresh failed')
  }
}

/**
 * Logout user - clear all auth data and session
 * Sends logout request to backend and clears local state
 * 
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Attempt to notify backend of logout
    const token = getAccessToken()
    if (token) {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        // Continue with logout even if backend request fails
        console.warn('Backend logout failed:', error)
      }
    }
  } finally {
    // Clear local auth state regardless of backend response
    const { logout: clearAuth } = useAuthStore.getState()
    clearAuth()
    
    // Clear localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

/**
 * Check if user is currently authenticated
 * 
 * @returns {boolean} - True if user has valid access token and user data
 */
export const isAuthenticated = () => {
  const token = getAccessToken()
  const user = getUser()
  return !!(token && user)
}

export default {
  firebaseLogin,
  storeAuthData,
  getAccessToken,
  getRefreshToken,
  getUser,
  refreshAccessToken,
  logout,
  isAuthenticated,
}
