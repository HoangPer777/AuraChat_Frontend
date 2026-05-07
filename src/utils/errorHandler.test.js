import { describe, it, expect, vi } from 'vitest'
import {
  ERROR_TYPES,
  categorizeError,
  formatErrorMessage,
  extractFieldErrors,
  logError,
  createError,
  isErrorType,
  isRetryableError,
} from './errorHandler'

describe('errorHandler', () => {
  describe('categorizeError', () => {
    it('should categorize 400 as VALIDATION error', () => {
      const error = { response: { status: 400 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.VALIDATION)
    })

    it('should categorize 401 as AUTHENTICATION error', () => {
      const error = { response: { status: 401 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.AUTHENTICATION)
    })

    it('should categorize 403 as AUTHORIZATION error', () => {
      const error = { response: { status: 403 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.AUTHORIZATION)
    })

    it('should categorize 404 as NOT_FOUND error', () => {
      const error = { response: { status: 404 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.NOT_FOUND)
    })

    it('should categorize 5xx as SERVER error', () => {
      const error = { response: { status: 500 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.SERVER)
    })

    it('should categorize network error without response', () => {
      const error = { code: 'ECONNREFUSED' }
      expect(categorizeError(error)).toBe(ERROR_TYPES.NETWORK)
    })

    it('should categorize timeout error', () => {
      const error = { code: 'ECONNABORTED' }
      expect(categorizeError(error)).toBe(ERROR_TYPES.TIMEOUT)
    })

    it('should categorize unknown error', () => {
      const error = { response: { status: 418 } }
      expect(categorizeError(error)).toBe(ERROR_TYPES.UNKNOWN)
    })
  })

  describe('formatErrorMessage', () => {
    it('should return API error message if available', () => {
      const error = {
        response: { data: { message: 'Custom error message' } },
      }
      const message = formatErrorMessage(error)
      expect(message).toBe('Custom error message')
    })

    it('should format validation error', () => {
      const error = { response: { status: 400 } }
      const message = formatErrorMessage(error)
      expect(message).toContain('check your input')
    })

    it('should format authentication error', () => {
      const error = { response: { status: 401 } }
      const message = formatErrorMessage(error)
      expect(message).toContain('session has expired')
    })

    it('should format authorization error', () => {
      const error = { response: { status: 403 } }
      const message = formatErrorMessage(error)
      expect(message).toContain('permission')
    })

    it('should format not found error', () => {
      const error = { response: { status: 404 } }
      const message = formatErrorMessage(error)
      expect(message).toContain('not found')
    })

    it('should format network error', () => {
      const error = { code: 'ECONNREFUSED' }
      const message = formatErrorMessage(error)
      expect(message).toContain('Connection failed')
    })

    it('should format timeout error', () => {
      const error = { code: 'ECONNABORTED' }
      const message = formatErrorMessage(error)
      expect(message).toContain('timed out')
    })

    it('should format server error', () => {
      const error = { response: { status: 500 } }
      const message = formatErrorMessage(error)
      expect(message).toContain('Server error')
    })
  })

  describe('extractFieldErrors', () => {
    it('should extract field errors from details object', () => {
      const error = {
        response: {
          data: {
            details: {
              email: 'Email already exists',
              password: 'Password too weak',
            },
          },
        },
      }
      const fieldErrors = extractFieldErrors(error)
      expect(fieldErrors).toEqual({
        email: 'Email already exists',
        password: 'Password too weak',
      })
    })

    it('should extract field errors from errors array', () => {
      const error = {
        response: {
          data: {
            errors: [
              { field: 'email', message: 'Invalid email' },
              { field: 'password', message: 'Too short' },
            ],
          },
        },
      }
      const fieldErrors = extractFieldErrors(error)
      expect(fieldErrors).toEqual({
        email: 'Invalid email',
        password: 'Too short',
      })
    })

    it('should return empty object if no field errors', () => {
      const error = { response: { data: {} } }
      const fieldErrors = extractFieldErrors(error)
      expect(fieldErrors).toEqual({})
    })
  })

  describe('logError', () => {
    it('should log error to console in development', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = { message: 'Test error', response: { status: 500 } }

      logError(error, 'test-context')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should include context and error type in log', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = { message: 'Test error', response: { status: 500 } }

      logError(error, 'test-context', { userId: '123' })

      const logCall = consoleSpy.mock.calls[0][1]
      expect(logCall.context).toBe('test-context')
      expect(logCall.errorType).toBe(ERROR_TYPES.SERVER)
      expect(logCall.userId).toBe('123')

      consoleSpy.mockRestore()
    })
  })

  describe('createError', () => {
    it('should create standardized error object', () => {
      const error = createError(ERROR_TYPES.VALIDATION, 'Invalid input', {
        field: 'email',
      })

      expect(error.type).toBe(ERROR_TYPES.VALIDATION)
      expect(error.message).toBe('Invalid input')
      expect(error.details.field).toBe('email')
      expect(error.timestamp).toBeDefined()
    })
  })

  describe('isErrorType', () => {
    it('should return true if error matches type', () => {
      const error = { response: { status: 401 } }
      expect(isErrorType(error, ERROR_TYPES.AUTHENTICATION)).toBe(true)
    })

    it('should return false if error does not match type', () => {
      const error = { response: { status: 401 } }
      expect(isErrorType(error, ERROR_TYPES.VALIDATION)).toBe(false)
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = { code: 'ECONNREFUSED' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for timeout errors', () => {
      const error = { code: 'ECONNABORTED' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for server errors', () => {
      const error = { response: { status: 500 } }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for validation errors', () => {
      const error = { response: { status: 400 } }
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for authentication errors', () => {
      const error = { response: { status: 401 } }
      expect(isRetryableError(error)).toBe(false)
    })
  })
})
