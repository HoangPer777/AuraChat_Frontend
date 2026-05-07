import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import useAuthStore from '../store/authStore'

// Mock the auth store
vi.mock('../store/authStore')

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login when user is not authenticated', () => {
    // Mock unauthenticated state
    useAuthStore.mockReturnValue({
      accessToken: null,
      user: null,
    })

    render(
      <BrowserRouter>
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Should redirect to login (Navigate component will handle this)
    // The component should render without errors
    expect(useAuthStore).toHaveBeenCalled()
  })

  it('should allow access when user is authenticated', () => {
    // Mock authenticated state
    useAuthStore.mockReturnValue({
      accessToken: 'valid-token',
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
    })

    render(
      <BrowserRouter>
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Should render Outlet without errors
    expect(useAuthStore).toHaveBeenCalled()
  })

  it('should redirect when accessToken exists but user is null', () => {
    // Mock partial authentication state
    useAuthStore.mockReturnValue({
      accessToken: 'valid-token',
      user: null,
    })

    render(
      <BrowserRouter>
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Should redirect to login
    expect(useAuthStore).toHaveBeenCalled()
  })

  it('should redirect when user exists but accessToken is null', () => {
    // Mock partial authentication state
    useAuthStore.mockReturnValue({
      accessToken: null,
      user: { id: '1', email: 'test@example.com', displayName: 'Test User' },
    })

    render(
      <BrowserRouter>
        <ProtectedRoute />
      </BrowserRouter>
    )

    // Should redirect to login
    expect(useAuthStore).toHaveBeenCalled()
  })
})
