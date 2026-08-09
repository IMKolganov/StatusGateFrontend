import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PublicHeader } from './PublicHeader'
import { ThemeProvider } from '../brand/theme'

const useAuth = vi.fn()

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('./HeaderUserMenu', () => ({
  HeaderUserMenu: ({ account }: { account: { email: string } }) => <span>{account.email}</span>,
}))

afterEach(() => {
  cleanup()
  useAuth.mockReset()
})

function renderHeader() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('PublicHeader', () => {
  it('shows sign-in when logged out', () => {
    useAuth.mockReturnValue({ account: null, loading: false, logout: vi.fn() })
    renderHeader()
    expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument()
  })

  it('shows sign-out when authenticated', () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'u@example.com',
        full_name: null,
        access_roles: ['user'],
        is_totp_enabled: false,
        has_password: true,
        has_google: false,
      },
      loading: false,
      logout,
    })
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }))
    expect(logout).toHaveBeenCalled()
  })
})
