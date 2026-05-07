/**
 * Error Handler Utilities
 * 
 * Provides error categorization, formatting, and logging for consistent
 * error handling across the application.
 * 
 * Requirements: 17 (Error Handling and User Feedback)
 */

/**
 * Error type constants
 */
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
}

/**
 * Categorize error based on HTTP status code or error type
 * 
 * @param {Error|Object} error - Error object from API or other source
 * @returns {string} - Error type from ERROR_TYPES
 */
export const categorizeError = (error) => {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return ERROR_TYPES.TIMEOUT
    }
    return ERROR_TYPES.NETWORK
  }

  const status = error.response.status

  // Validation error
  if (status === 400) {
    return ERROR_TYPES.VALIDATION
  }

  // Authentication error
  if (status === 401) {
    return ERROR_TYPES.AUTHENTICATION
  }

  // Authorization error
  if (status === 403) {
    return ERROR_TYPES.AUTHORIZATION
  }

  // Not found error
  if (status === 404) {
    return ERROR_TYPES.NOT_FOUND
  }

  // Server error
  if (status >= 500) {
    return ERROR_TYPES.SERVER
  }

  return ERROR_TYPES.UNKNOWN
}

/**
 * Format error message for user display
 * Converts technical error messages to user-friendly text
 * 
 * @param {Error|Object} error - Error object
 * @param {string} context - Context for error (e.g., 'login', 'upload')
 * @returns {string} - User-friendly error message
 */
export const formatErrorMessage = (error, context = '') => {
  const errorType = categorizeError(error)

  // Try to get error message from API response
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // Categorized error messages
  switch (errorType) {
    case ERROR_TYPES.VALIDATION:
      return 'Please check your input and try again.'

    case ERROR_TYPES.AUTHENTICATION:
      return 'Your session has expired. Please log in again.'

    case ERROR_TYPES.AUTHORIZATION:
      return 'You do not have permission to perform this action.'

    case ERROR_TYPES.NOT_FOUND:
      return 'The requested resource was not found.'

    case ERROR_TYPES.NETWORK:
      return 'Connection failed. Please check your internet connection and try again.'

    case ERROR_TYPES.TIMEOUT:
      return 'Request timed out. Please check your connection and try again.'

    case ERROR_TYPES.SERVER:
      return 'Server error. Please try again later.'

    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Extract field-specific validation errors from API response
 * 
 * @param {Error|Object} error - Error object from API
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const extractFieldErrors = (error) => {
  const fieldErrors = {}

  // Check for details object in response
  if (error.response?.data?.details) {
    return error.response.data.details
  }

  // Check for errors array in response
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    error.response.data.errors.forEach((err) => {
      if (err.field) {
        fieldErrors[err.field] = err.message
      }
    })
    return fieldErrors
  }

  return fieldErrors
}

/**
 * Log error for debugging and monitoring
 * In development, logs to console
 * In production, would send to monitoring service
 * 
 * @param {Error|Object} error - Error object
 * @param {string} context - Context for error (e.g., 'login', 'upload')
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = '', additionalData = {}) => {
  const errorType = categorizeError(error)
  const timestamp = new Date().toISOString()

  const errorLog = {
    timestamp,
    context,
    errorType,
    message: error.message,
    status: error.response?.status,
    url: error.response?.config?.url,
    ...additionalData,
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Log]', errorLog)
    if (error.response?.data) {
      console.error('[Response Data]', error.response.data)
    }
  }

  // TODO: Send to monitoring service in production
  // Example: sendToMonitoringService(errorLog)
}

/**
 * Create a standardized error object
 * 
 * @param {string} type - Error type from ERROR_TYPES
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} - Standardized error object
 */
export const createError = (type, message, details = {}) => {
  return {
    type,
    message,
    details,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check if error is a specific type
 * 
 * @param {Error|Object} error - Error object
 * @param {string} errorType - Error type to check
 * @returns {boolean} - True if error matches type
 */
export const isErrorType = (error, errorType) => {
  return categorizeError(error) === errorType
}

/**
 * Check if error is retryable
 * Some errors should not be retried (validation, auth, etc.)
 * 
 * @param {Error|Object} error - Error object
 * @returns {boolean} - True if error should be retried
 */
export const isRetryableError = (error) => {
  const errorType = categorizeError(error)
  const retryableTypes = [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SERVER,
  ]
  return retryableTypes.includes(errorType)
}

export default {
  ERROR_TYPES,
  categorizeError,
  formatErrorMessage,
  extractFieldErrors,
  logError,
  createError,
  isErrorType,
  isRetryableError,
}
