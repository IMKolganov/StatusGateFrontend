import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SecurityPage } from './SecurityPage'

const setup2fa = vi.fn()
const enable2fa = vi.fn()
const disable2fa = vi.fn()
const linkPassword = vi.fn()
const refreshAccount = vi.fn()
const useAuth = vi.fn()

vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  }
  return {
    ApiError,
    api: {
      setup2fa: (...args: unknown[]) => setup2fa(...args),
      enable2fa: (...args: unknown[]) => enable2fa(...args),
      disable2fa: (...args: unknown[]) => disable2fa(...args),
      linkPassword: (...args: unknown[]) => linkPassword(...args),
    },
  }
})

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../components/AccountLayout', () => ({
  AccountLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
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

describe('SecurityPage', () => {
  beforeEach(() => {
    setup2fa.mockReset()
    enable2fa.mockReset()
    disable2fa.mockReset()
    linkPassword.mockReset()
    refreshAccount.mockReset()
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
      refreshAccount,
    })
  })

  afterEach(() => cleanup())

  it('starts 2FA setup and enables with a code', async () => {
    setup2fa.mockResolvedValue({
      secret: 'SEC',
      otpauth_url: 'otpauth://totp/StatusGate',
      qr_code_base64: 'abc',
    })
    enable2fa.mockResolvedValue({})
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/2FA is not enabled/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Set up 2FA/i }))
    await flush()
    expect(await screen.findByAltText(/2FA QR code/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Enable 2FA/i }))
    await flush()
    await waitFor(() => expect(enable2fa).toHaveBeenCalledWith('123456'))
    expect(screen.getByText(/Two-factor authentication enabled/i)).toBeInTheDocument()
  })

  it('shows setup and enable errors', async () => {
    const { ApiError } = await import('../api/client')
    setup2fa.mockRejectedValueOnce(new ApiError('setup blocked', 400))
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Set up 2FA/i }))
    await flush()
    expect(await screen.findByText('setup blocked')).toBeInTheDocument()

    setup2fa.mockResolvedValueOnce({
      secret: 'SEC',
      otpauth_url: 'otpauth://totp/StatusGate',
      qr_code_base64: 'abc',
    })
    enable2fa.mockRejectedValueOnce(new ApiError('bad code', 400))
    fireEvent.click(screen.getByRole('button', { name: /Set up 2FA/i }))
    await flush()
    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: /Enable 2FA/i }))
    await flush()
    expect(await screen.findByText('bad code')).toBeInTheDocument()
  })

  it('disables 2FA when enabled with a password', async () => {
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'u@x.com',
        full_name: null,
        access_roles: ['user'],
        is_totp_enabled: true,
        has_password: true,
        has_google: false,
      },
      refreshAccount,
    })
    disable2fa.mockResolvedValue({})

    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/2FA is enabled/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret12' } })
    fireEvent.change(screen.getByLabelText(/Current 2FA code/i), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: /Disable 2FA/i }))
    await flush()
    await waitFor(() =>
      expect(disable2fa).toHaveBeenCalledWith({ password: 'secret12', code: '654321' }),
    )
    expect(screen.getByText(/Two-factor authentication disabled/i)).toBeInTheDocument()
  })

  it('links a password for Google-only accounts', async () => {
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'g@x.com',
        full_name: null,
        access_roles: ['user'],
        is_totp_enabled: false,
        has_password: false,
        has_google: true,
      },
      refreshAccount,
    })
    linkPassword.mockResolvedValue({})

    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText(/New password/i), { target: { value: 'password1' } })
    fireEvent.click(screen.getByRole('button', { name: /Link password/i }))
    await flush()
    await waitFor(() => expect(linkPassword).toHaveBeenCalledWith('password1'))
    expect(screen.getByText(/Password linked/i)).toBeInTheDocument()
  })
})
