import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeaderUserMenu } from './HeaderUserMenu'

vi.mock('./AccountAvatar', () => ({
  AccountAvatar: () => <span data-testid="avatar" />,
}))

describe('HeaderUserMenu', () => {
  afterEach(() => cleanup())

  it('links to account with display name', () => {
    render(
      <MemoryRouter>
        <HeaderUserMenu
          account={{
            id: '1',
            email: 'user@example.com',
            full_name: 'Ada Lovelace',
            access_roles: ['user'],
            is_totp_enabled: false,
            has_password: true,
            has_google: false,
          }}
        />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Ada Lovelace/i })
    expect(link).toHaveAttribute('href', '/account')
    expect(link).toHaveAttribute('title', 'user@example.com')
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })
})
