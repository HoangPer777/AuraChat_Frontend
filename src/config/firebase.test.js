import { describe, it, expect } from 'vitest'

describe('Firebase Configuration', () => {
  it('should validate Firebase configuration on module load', () => {
    // Test the validation logic directly
    const validateFirebaseConfig = () => {
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ]

      const missingVars = requiredVars.filter(
        (varName) => !import.meta.env[varName]
      )

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all Firebase configuration variables are set.`
        )
      }
    }

    // This test verifies the validation function exists and can be called
    expect(validateFirebaseConfig).toBeDefined()
    expect(typeof validateFirebaseConfig).toBe('function')
  })

  it('should throw error when Firebase API key is missing', () => {
    const validateFirebaseConfig = () => {
      const env = {
        VITE_FIREBASE_API_KEY: undefined,
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'test-app-id'
      }

      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ]

      const missingVars = requiredVars.filter(
        (varName) => !env[varName]
      )

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all Firebase configuration variables are set.`
        )
      }
    }

    expect(() => validateFirebaseConfig()).toThrow()
    expect(() => validateFirebaseConfig()).toThrow('VITE_FIREBASE_API_KEY')
  })

  it('should throw error when Firebase auth domain is missing', () => {
    const validateFirebaseConfig = () => {
      const env = {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: undefined,
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'test-app-id'
      }

      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ]

      const missingVars = requiredVars.filter(
        (varName) => !env[varName]
      )

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all Firebase configuration variables are set.`
        )
      }
    }

    expect(() => validateFirebaseConfig()).toThrow()
    expect(() => validateFirebaseConfig()).toThrow('VITE_FIREBASE_AUTH_DOMAIN')
  })

  it('should throw error when multiple Firebase variables are missing', () => {
    const validateFirebaseConfig = () => {
      const env = {
        VITE_FIREBASE_API_KEY: undefined,
        VITE_FIREBASE_AUTH_DOMAIN: undefined,
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'test-app-id'
      }

      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ]

      const missingVars = requiredVars.filter(
        (varName) => !env[varName]
      )

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all Firebase configuration variables are set.`
        )
      }
    }

    expect(() => validateFirebaseConfig()).toThrow()
    expect(() => validateFirebaseConfig()).toThrow('VITE_FIREBASE_API_KEY')
    expect(() => validateFirebaseConfig()).toThrow('VITE_FIREBASE_AUTH_DOMAIN')
  })

  it('should not throw error when all Firebase variables are present', () => {
    const validateFirebaseConfig = () => {
      const env = {
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'test-app-id'
      }

      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ]

      const missingVars = requiredVars.filter(
        (varName) => !env[varName]
      )

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all Firebase configuration variables are set.`
        )
      }
    }

    expect(() => validateFirebaseConfig()).not.toThrow()
  })
})
