import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountsPage } from './AccountsPage'

const listAccounts = vi.fn()
const updateAccountRoles = vi.fn()

vi.mock('../api/client', () => ({
  api: {
    listAccounts: (...args: unknown[]) => listAccounts(...args),
    updateAccountRoles: (...args: unknown[]) => updateAccountRoles(...args),
  },
}))

vi.mock('../components/AdminLayout', () => ({
  AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('AccountsPage', () => {
  beforeEach(() => {
    listAccounts.mockReset()
    updateAccountRoles.mockReset()
    listAccounts.mockResolvedValue({
      items: [
        {
          id: 'a1',
          email: 'ops@example.com',
          is_active: true,
          access_roles: ['operator'],
          full_name: null,
          is_totp_enabled: false,
          has_password: true,
          has_google: false,
        },
      ],
      total: 1,
    })
    updateAccountRoles.mockResolvedValue({})
  })

  afterEach(() => cleanup())

  it('lists accounts and toggles roles', async () => {
    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Accounts' })).toBeInTheDocument()
    expect(screen.getByText('ops@example.com')).toBeInTheDocument()

    const checkboxes = screen.getAllByRole('checkbox')
    // admin, operator, viewer, user — operator already checked
    fireEvent.click(checkboxes[0]!)
    await flush()
    await waitFor(() =>
      expect(updateAccountRoles).toHaveBeenCalledWith('a1', expect.arrayContaining(['admin', 'operator'])),
    )
  })
})
