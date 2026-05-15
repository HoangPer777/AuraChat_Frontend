/**
 * Form Validation Utilities
 * 
 * Provides validation functions for common form fields including:
 * - Email validation (RFC 5322 format)
 * - Password validation (minimum 8 characters)
 * - Password confirmation matching
 * - Avatar file validation (size, type)
 * - Profile field validation (display name, bio)
 * 
 * Requirements: 1, 5, 6, 7, 9, 10 (Validation requirements)
 */

/**
 * Validate email format using RFC 5322 simplified pattern
 * 
 * @param {string} email - Email address to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate password strength
 * Minimum 8 characters required
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate password confirmation matches password
 * 
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate avatar file
 * Checks file size (max 5 MB) and type (JPEG, PNG, GIF, WebP)
 * 
 * @param {File} file - File object from input
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateAvatarFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'Please select a file' }
  }

  // Check file size (5 MB = 5242880 bytes)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5 MB' }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type must be JPEG, PNG, GIF, or WebP',
    }
  }

  return { isValid: true, error: null }
}

/**
 * Validate display name
 * Required field, minimum 1 character, maximum 50 characters
 * 
 * @param {string} displayName - Display name to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateDisplayName = (displayName) => {
  if (!displayName || displayName.trim() === '') {
    return { isValid: false, error: 'Display name is required' }
  }

  if (displayName.length > 50) {
    return { isValid: false, error: 'Display name must be less than 50 characters' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate bio
 * Optional field, maximum 500 characters
 * 
 * @param {string} bio - Bio to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateBio = (bio) => {
  if (!bio) {
    return { isValid: true, error: null }
  }

  if (bio.length > 500) {
    return { isValid: false, error: 'Bio must be less than 500 characters' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate media file
 * Checks file size (max 10 MB) and type based on mode
 * 
 * @param {File} file - File object from input
 * @param {'image'|'file'} mode - Upload mode
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateMediaFile = (file, mode) => {
  if (!file) {
    return { isValid: false, error: 'Vui long chon tep de tai len.' }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { isValid: false, error: 'Dung luong toi da 10MB. Vui long chon tep nho hon.' }
  }

  if (mode === 'image') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Chi ho tro anh JPG, PNG, GIF, WebP.' }
    }
    return { isValid: true, error: null }
  }

  const allowedExtensions = ['pdf', 'docx', 'xlsx', 'txt']
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Chi ho tro PDF, DOCX, XLSX, TXT.' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate login form data
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.email - Email address
 * @param {string} formData.password - Password
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateLoginForm = (formData) => {
  const errors = {}

  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate registration form data
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.email - Email address
 * @param {string} formData.password - Password
 * @param {string} formData.confirmPassword - Confirmation password
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateRegistrationForm = (formData) => {
  const errors = {}

  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error
  }

  const confirmValidation = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  )
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate password reset form data
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.password - New password
 * @param {string} formData.confirmPassword - Confirmation password
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validatePasswordResetForm = (formData) => {
  const errors = {}

  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error
  }

  const confirmValidation = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  )
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate profile form data
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.displayName - Display name
 * @param {string} formData.bio - Bio (optional)
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateProfileForm = (formData) => {
  const errors = {}

  const displayNameValidation = validateDisplayName(formData.displayName)
  if (!displayNameValidation.isValid) {
    errors.displayName = displayNameValidation.error
  }

  const bioValidation = validateBio(formData.bio)
  if (!bioValidation.isValid) {
    errors.bio = bioValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate forgot password form data
 * 
 * @param {Object} formData - Form data object
 * @param {string} formData.email - Email address
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateForgotPasswordForm = (formData) => {
  const errors = {}

  const emailValidation = validateEmail(formData.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export default {
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
}
