import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const registrationStatus = vi.fn()
const register = vi.fn()
const login = vi.fn()
const verifyMfa = vi.fn()
const completeLogin = vi.fn()
const useAuth = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    registrationStatus: (...args: unknown[]) => registrationStatus(...args),
    register: (...args: unknown[]) => register(...args),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))

vi.mock('../components/BrandLogo', () => ({
  BrandLogo: () => <div>logo</div>,
}))

vi.mock('../components/auth/GoogleLoginForm', () => ({
  GoogleLoginForm: () => <div data-testid="google-login" />,
}))

vi.mock('../utils/runtimeEnv', () => ({
  getRuntimeEnv: () => ({ googleClientId: '' }),
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderLogin(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>home</div>} />
        <Route path="/register/complete" element={<div>register-complete</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    registrationStatus.mockReset()
    register.mockReset()
    login.mockReset()
    verifyMfa.mockReset()
    completeLogin.mockReset()
    registrationStatus.mockResolvedValue({
      allow_registration: true,
      google_oauth_enabled: false,
      google_client_id: null,
      require_email_verification: false,
    })
    useAuth.mockReturnValue({
      account: null,
      login,
      verifyMfa,
      completeLogin,
    })
  })

  afterEach(() => cleanup())

  it('signs in with email/password', async () => {
    login.mockResolvedValue('ok')
    renderLogin()
    await flush()
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret12' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))
    await flush()
    expect(login).toHaveBeenCalledWith('a@b.c', 'secret12')
    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument())
  })

  it('prompts for MFA when login returns a token', async () => {
    login.mockResolvedValue('mfa-token-1')
    renderLogin()
    await flush()
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret12' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))
    await flush()
    expect(await screen.findByLabelText(/2FA code/i)).toBeInTheDocument()
    verifyMfa.mockResolvedValue(undefined)
    fireEvent.change(screen.getByLabelText(/2FA code/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Verify 2FA/i }))
    await flush()
    expect(verifyMfa).toHaveBeenCalledWith('mfa-token-1', '123456')
  })

  it('switches to registration mode', async () => {
    register.mockResolvedValue({ id: '1' })
    renderLogin()
    await flush()
    fireEvent.click(await screen.findByRole('button', { name: /Create an account/i }))
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'new@b.c' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret12' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
    await flush()
    expect(register).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('register-complete')).toBeInTheDocument())
  })
})
