import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthRoute } from './AuthRoute'

const useAuth = vi.fn()

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

afterEach(() => {
  cleanup()
  useAuth.mockReset()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/account"
          element={
            <AuthRoute>
              <div>account-ok</div>
            </AuthRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthRoute', () => {
  it('shows loading while auth is resolving', () => {
    useAuth.mockReturnValue({ account: null, loading: true })
    renderAt('/account')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    useAuth.mockReturnValue({ account: null, loading: false })
    renderAt('/account')
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
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
      loading: false,
    })
    renderAt('/account')
    expect(screen.getByText('account-ok')).toBeInTheDocument()
  })
})
