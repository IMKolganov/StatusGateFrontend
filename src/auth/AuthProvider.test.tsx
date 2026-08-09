import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../api/client'
import { AuthContext } from './context'
import { AuthProvider } from './AuthProvider'

const me = vi.fn()
const login = vi.fn()
const login2fa = vi.fn()
const logout = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    me: (...args: unknown[]) => me(...args),
    login: (...args: unknown[]) => login(...args),
    login2fa: (...args: unknown[]) => login2fa(...args),
    logout: (...args: unknown[]) => logout(...args),
  },
}))

const sampleAccount: Account = {
  id: 'acc-1',
  email: 'admin@example.com',
  full_name: 'Admin',
  access_roles: ['admin'],
  is_totp_enabled: false,
  has_password: true,
  has_google: false,
}

function Probe() {
  const ctx = useContext(AuthContext)
  if (!ctx) return <div>missing</div>
  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="email">{ctx.account?.email ?? 'none'}</div>
      <button type="button" onClick={() => void ctx.login('a@b.c', 'secret')}>
        login
      </button>
      <button type="button" onClick={() => void ctx.verifyMfa('mfa-token', '123456')}>
        mfa
      </button>
      <button type="button" onClick={() => void ctx.logout()}>
        logout
      </button>
      <button
        type="button"
        onClick={() => {
          void ctx.login('a@b.c', 'secret').then((result) => {
            ;(document.getElementById('login-result') as HTMLElement).textContent = result
          })
        }}
      >
        login-result
      </button>
      <span id="login-result" />
    </div>
  )
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('AuthProvider', () => {
  beforeEach(() => {
    me.mockReset()
    login.mockReset()
    login2fa.mockReset()
    logout.mockReset()
    me.mockResolvedValue(sampleAccount)
    logout.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  it('loads the current account on mount', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await flush()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('email').textContent).toBe('admin@example.com')
  })

  it('clears account when me() fails', async () => {
    me.mockRejectedValueOnce(new Error('unauthorized'))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await flush()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('email').textContent).toBe('none')
  })

  it('returns mfa_token when login requires MFA', async () => {
    me.mockResolvedValueOnce(undefined).mockResolvedValue(sampleAccount)
    login.mockResolvedValue({ mfa_required: true, mfa_token: 'tok-mfa' })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await flush()
    await act(async () => {
      screen.getByRole('button', { name: 'login-result' }).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => expect(screen.getByText('tok-mfa')).toBeInTheDocument())
  })

  it('completes login and verifyMfa by refreshing account', async () => {
    me.mockResolvedValueOnce(undefined).mockResolvedValue(sampleAccount)
    login.mockResolvedValue(sampleAccount)
    login2fa.mockResolvedValue(sampleAccount)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await flush()
    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@example.com'))

    me.mockResolvedValueOnce(undefined)
    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
      await Promise.resolve()
    })
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'))

    me.mockResolvedValue(sampleAccount)
    await act(async () => {
      screen.getByRole('button', { name: 'mfa' }).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(login2fa).toHaveBeenCalledWith({ mfa_token: 'mfa-token', code: '123456' })
  })
})
