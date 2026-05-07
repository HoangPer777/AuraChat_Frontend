import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateAvatarFile,
  validateDisplayName,
  validateBio,
  validateLoginForm,
  validateRegistrationForm,
  validatePasswordResetForm,
  validateProfileForm,
  validateForgotPasswordForm,
} from './validation'

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = validateEmail('test@example.com')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject email without @', () => {
      const result = validateEmail('testexample.com')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('valid email')
    })

    it('should reject email without domain', () => {
      const result = validateEmail('test@')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('valid email')
    })

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ]
      validEmails.forEach((email) => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('validatePassword', () => {
    it('should validate password with 8+ characters', () => {
      const result = validatePassword('password123')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject empty password', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject password with less than 8 characters', () => {
      const result = validatePassword('pass123')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('8 characters')
    })

    it('should accept password with exactly 8 characters', () => {
      const result = validatePassword('password')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validatePasswordConfirmation', () => {
    it('should validate matching passwords', () => {
      const result = validatePasswordConfirmation('password123', 'password123')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject empty confirmation', () => {
      const result = validatePasswordConfirmation('password123', '')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('confirm')
    })

    it('should reject non-matching passwords', () => {
      const result = validatePasswordConfirmation('password123', 'password456')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('do not match')
    })
  })

  describe('validateAvatarFile', () => {
    it('should validate correct image file', () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = validateAvatarFile(file)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject empty file', () => {
      const result = validateAvatarFile(null)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('select a file')
    })

    it('should reject file larger than 5 MB', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('x').join('')
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const result = validateAvatarFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('5 MB')
    })

    it('should reject non-image file types', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      const result = validateAvatarFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('JPEG, PNG, GIF, or WebP')
    })

    it('should accept all valid image formats', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      validTypes.forEach((type) => {
        const file = new File(['content'], 'avatar', { type })
        const result = validateAvatarFile(file)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('validateDisplayName', () => {
    it('should validate non-empty display name', () => {
      const result = validateDisplayName('John Doe')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject empty display name', () => {
      const result = validateDisplayName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject whitespace-only display name', () => {
      const result = validateDisplayName('   ')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject display name longer than 50 characters', () => {
      const longName = 'a'.repeat(51)
      const result = validateDisplayName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('50 characters')
    })

    it('should accept display name with exactly 50 characters', () => {
      const name = 'a'.repeat(50)
      const result = validateDisplayName(name)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateBio', () => {
    it('should validate non-empty bio', () => {
      const result = validateBio('This is my bio')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should accept empty bio (optional field)', () => {
      const result = validateBio('')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should reject bio longer than 500 characters', () => {
      const longBio = 'a'.repeat(501)
      const result = validateBio(longBio)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('500 characters')
    })

    it('should accept bio with exactly 500 characters', () => {
      const bio = 'a'.repeat(500)
      const result = validateBio(bio)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateLoginForm', () => {
    it('should validate correct login form', () => {
      const formData = {
        email: 'test@example.com',
        password: 'password123',
      }
      const result = validateLoginForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should collect multiple validation errors', () => {
      const formData = {
        email: 'invalid-email',
        password: 'short',
      }
      const result = validateLoginForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
      expect(result.errors.password).toBeDefined()
    })
  })

  describe('validateRegistrationForm', () => {
    it('should validate correct registration form', () => {
      const formData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }
      const result = validateRegistrationForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject non-matching passwords', () => {
      const formData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password456',
      }
      const result = validateRegistrationForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })
  })

  describe('validatePasswordResetForm', () => {
    it('should validate correct password reset form', () => {
      const formData = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      }
      const result = validatePasswordResetForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject non-matching passwords', () => {
      const formData = {
        password: 'newpassword123',
        confirmPassword: 'different123',
      }
      const result = validatePasswordResetForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })
  })

  describe('validateProfileForm', () => {
    it('should validate correct profile form', () => {
      const formData = {
        displayName: 'John Doe',
        bio: 'My bio',
      }
      const result = validateProfileForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should accept profile form with empty bio', () => {
      const formData = {
        displayName: 'John Doe',
        bio: '',
      }
      const result = validateProfileForm(formData)
      expect(result.isValid).toBe(true)
    })

    it('should reject profile form with empty display name', () => {
      const formData = {
        displayName: '',
        bio: 'My bio',
      }
      const result = validateProfileForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.errors.displayName).toBeDefined()
    })
  })

  describe('validateForgotPasswordForm', () => {
    it('should validate correct forgot password form', () => {
      const formData = {
        email: 'test@example.com',
      }
      const result = validateForgotPasswordForm(formData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject invalid email', () => {
      const formData = {
        email: 'invalid-email',
      }
      const result = validateForgotPasswordForm(formData)
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })
  })
})
