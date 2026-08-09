import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountPage } from './AccountPage'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    account: {
      id: '1',
      email: 'user@example.com',
      full_name: 'Ada Lovelace',
      access_roles: ['user'],
      is_totp_enabled: false,
      has_password: true,
      has_google: false,
    },
  }),
}))

vi.mock('../components/AccountLayout', () => ({
  AccountLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode
    title: string
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

afterEach(() => cleanup())

describe('AccountPage', () => {
  it('shows profile details', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Your account/i })).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText(/Signed in with email/i)).toBeInTheDocument()
  })
})
