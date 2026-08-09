import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminRoute } from './AdminRoute'

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
          path="/admin"
          element={
            <AdminRoute>
              <div>admin-ok</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/" element={<div>home-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  it('shows loading while auth is resolving', () => {
    useAuth.mockReturnValue({ account: null, loading: true })
    renderAt('/admin')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    useAuth.mockReturnValue({ account: null, loading: false })
    renderAt('/admin')
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('redirects authenticated non-admin users home', () => {
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
    renderAt('/admin')
    expect(screen.getByText('home-page')).toBeInTheDocument()
  })

  it('renders children for panel roles', () => {
    useAuth.mockReturnValue({
      account: {
        id: '1',
        email: 'a@x.com',
        full_name: null,
        access_roles: ['viewer'],
        is_totp_enabled: false,
        has_password: true,
        has_google: false,
      },
      loading: false,
    })
    renderAt('/admin')
    expect(screen.getByText('admin-ok')).toBeInTheDocument()
  })
})
