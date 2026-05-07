import { create } from 'zustand'

/**
 * Auth Store - Manages user authentication state and tokens
 * 
 * State:
 * - user: Current authenticated user object or null
 * - accessToken: JWT token for API requests (persisted to localStorage)
 * - refreshToken: JWT token for refreshing access token (persisted to localStorage)
 * - isLoading: Loading state for auth operations
 * - error: Error message from auth operations
 * 
 * Persistence:
 * - accessToken and refreshToken are persisted to localStorage
 * - Tokens are restored from localStorage on app startup
 * - Tokens are cleared on logout
 */
const useAuthStore = create((set) => ({
  // State
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  error: null,

  // Actions
  /**
   * Set complete auth state with user and tokens
   * Persists tokens to localStorage
   */
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, refreshToken, error: null })
  },

  /**
   * Update access token (called during token refresh)
   * Persists new token to localStorage
   */
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ accessToken })
  },

  /**
   * Update user profile information
   */
  setUser: (user) => {
    set({ user })
  },

  /**
   * Set loading state for auth operations
   */
  setLoading: (isLoading) => {
    set({ isLoading })
  },

  /**
   * Set error message from auth operation
   */
  setError: (error) => {
    set({ error })
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Logout user - clears all auth state and localStorage
   */
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null, error: null, isLoading: false })
  },
}))

export default useAuthStore
