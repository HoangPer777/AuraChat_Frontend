import { describe, expect, it } from 'vitest'
import { isPopupBlockedError } from './oauth'

describe('isPopupBlockedError', () => {
  it('detects firebase popup blocked codes', () => {
    expect(isPopupBlockedError({ code: 'auth/popup-blocked' })).toBe(true)
    expect(isPopupBlockedError({ code: 'auth/operation-not-supported-in-this-environment' })).toBe(true)
    expect(isPopupBlockedError({ code: 'auth/popup-closed-by-user' })).toBe(false)
  })
})
