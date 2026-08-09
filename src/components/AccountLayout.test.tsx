import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountLayout } from './AccountLayout'

const useAuth = vi.fn()

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('./PublicHeader', () => ({
  PublicHeader: () => <header>PublicHeader</header>,
}))

describe('AccountLayout', () => {
  afterEach(() => cleanup())

  it('renders title, subtitle, and account nav', () => {
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'u@x.com',
        full_name: null,
        access_roles: ['user'],
        is_totp_enabled: false,
        has_password: true,
        has_google: false,
      },
    })

    render(
      <MemoryRouter>
        <AccountLayout title="Account" subtitle="Profile details">
          <p>Body</p>
        </AccountLayout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('Profile details')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('href', '/account/security')
    expect(screen.queryByRole('link', { name: 'Admin panel' })).not.toBeInTheDocument()
  })

  it('shows admin panel link for admins', () => {
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'a@x.com',
        full_name: null,
        access_roles: ['admin'],
        is_totp_enabled: false,
        has_password: true,
        has_google: false,
      },
    })

    render(
      <MemoryRouter>
        <AccountLayout title="Account">
          <span />
        </AccountLayout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Admin panel' })).toHaveAttribute('href', '/admin')
  })
})
