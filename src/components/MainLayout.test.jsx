import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MainLayout from './MainLayout'
import useAuthStore from '../store/authStore'

// Mock the auth store
vi.mock('../store/authStore')

// Mock the API
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
      },
      logout: vi.fn(),
    })
  })

  it('should render navigation bar with brand name', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('AuraChat')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    // Check for navigation links
    const chatLinks = screen.getAllByText('Chat')
    expect(chatLinks.length).toBeGreaterThan(0)

    const profileLinks = screen.getAllByText('Profile')
    expect(profileLinks.length).toBeGreaterThan(0)
  })

  it('should display user avatar and name', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should open user menu when avatar is clicked', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    const userMenuButton = screen.getByLabelText('User menu')
    fireEvent.click(userMenuButton)

    // Menu should be open and show logout button
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should display user email in dropdown menu', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    const userMenuButton = screen.getByLabelText('User menu')
    fireEvent.click(userMenuButton)

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should render avatar with initials when no avatar URL', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    )

    // Avatar should show first letter of display name
    const avatarElements = screen.getAllByText('T')
    expect(avatarElements.length).toBeGreaterThan(0)
  })
})
