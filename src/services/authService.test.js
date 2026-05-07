import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as authService from './authService'
import useAuthStore from '../store/authStore'
import api from './api'

// Mock the API and auth store
vi.mock('./api')
vi.mock('../store/authStore')

describe('authService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('firebaseLogin', () => {
    it('should send ID token to backend and store auth data', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
        },
      }

      api.post.mockResolvedValue(mockResponse)
      useAuthStore.getState.mockReturnValue({
        setAuth: vi.fn(),
      })

      const result = await authService.firebaseLogin('mock-id-token')

      expect(api.post).toHaveBeenCalledWith('/auth/firebase/login', {
        idToken: 'mock-id-token',
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on failed login', async () => {
      const mockError = {
        response: { data: { message: 'Invalid token' } },
      }

      api.post.mockRejectedValue(mockError)

      await expect(authService.firebaseLogin('invalid-token')).rejects.toThrow(
        'Invalid token'
      )
    })
  })

  describe('storeAuthData', () => {
    it('should store auth data in localStorage and auth store', () => {
      const mockSetAuth = vi.fn()
      useAuthStore.getState.mockReturnValue({
        setAuth: mockSetAuth,
      })

      const authData = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com' },
      }

      authService.storeAuthData(authData)

      // Check that setAuth was called with correct arguments
      expect(mockSetAuth).toHaveBeenCalledWith(
        authData.user,
        authData.accessToken,
        authData.refreshToken
      )
    })
  })

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorage.setItem('accessToken', 'test-token')

      const token = authService.getAccessToken()

      expect(token).toBe('test-token')
    })

    it('should return null if no access token', () => {
      const token = authService.getAccessToken()

      expect(token).toBeNull()
    })
  })

  describe('getRefreshToken', () => {
    it('should return refresh token from localStorage', () => {
      localStorage.setItem('refreshToken', 'test-refresh-token')

      const token = authService.getRefreshToken()

      expect(token).toBe('test-refresh-token')
    })

    it('should return null if no refresh token', () => {
      const token = authService.getRefreshToken()

      expect(token).toBeNull()
    })
  })

  describe('getUser', () => {
    it('should return user from auth store', () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      useAuthStore.getState.mockReturnValue({
        user: mockUser,
      })

      const user = authService.getUser()

      expect(user).toEqual(mockUser)
    })

    it('should return null if no user', () => {
      useAuthStore.getState.mockReturnValue({
        user: null,
      })

      const user = authService.getUser()

      expect(user).toBeNull()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token and update store', async () => {
      localStorage.setItem('refreshToken', 'old-refresh-token')

      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      }

      api.post.mockResolvedValue(mockResponse)
      useAuthStore.getState.mockReturnValue({
        setAccessToken: vi.fn(),
      })

      const newToken = await authService.refreshAccessToken()

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      })
      expect(newToken).toBe('new-access-token')
      expect(localStorage.getItem('accessToken')).toBe('new-access-token')
    })

    it('should logout on refresh failure', async () => {
      localStorage.setItem('refreshToken', 'invalid-token')

      const mockError = {
        response: { data: { message: 'Invalid refresh token' } },
      }

      api.post.mockRejectedValue(mockError)
      useAuthStore.getState.mockReturnValue({
        logout: vi.fn(),
      })

      await expect(authService.refreshAccessToken()).rejects.toThrow(
        'Invalid refresh token'
      )

      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear auth data and call backend logout', async () => {
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'test-refresh-token')

      const mockLogout = vi.fn()
      useAuthStore.getState.mockReturnValue({
        logout: mockLogout,
      })

      api.post.mockResolvedValue({})

      await authService.logout()

      expect(api.post).toHaveBeenCalledWith('/auth/logout')
      expect(mockLogout).toHaveBeenCalled()
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })

    it('should clear auth data even if backend logout fails', async () => {
      localStorage.setItem('accessToken', 'test-token')

      const mockLogout = vi.fn()
      useAuthStore.getState.mockReturnValue({
        logout: mockLogout,
      })

      api.post.mockRejectedValue(new Error('Network error'))

      await authService.logout()

      expect(mockLogout).toHaveBeenCalled()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true if user has token and user data', () => {
      localStorage.setItem('accessToken', 'test-token')
      useAuthStore.getState.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
      })

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(true)
    })

    it('should return false if no access token', () => {
      useAuthStore.getState.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
      })

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })

    it('should return false if no user', () => {
      localStorage.setItem('accessToken', 'test-token')
      useAuthStore.getState.mockReturnValue({
        user: null,
      })

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })
})
