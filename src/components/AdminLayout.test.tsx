import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminLayout } from './AdminLayout'

const logout = vi.fn()
const useAuth = vi.fn()

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('./BrandLogo', () => ({
  BrandLogo: () => <div>Logo</div>,
}))

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

describe('AdminLayout', () => {
  beforeEach(() => {
    logout.mockReset()
    localStorage.clear()
    useAuth.mockReturnValue({
      logout,
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
  })

  afterEach(() => cleanup())

  it('renders navigation, title, and signs out', () => {
    render(
      <MemoryRouter initialEntries={['/admin/projects']}>
        <Routes>
          <Route
            path="/admin/projects"
            element={
              <AdminLayout title="Projects" subtitle="Manage projects">
                <p>Child</p>
              </AdminLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Manage projects')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Accounts' })).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }))
    expect(logout).toHaveBeenCalled()
  })

  it('hides admin-only links for non-admins and toggles sections', () => {
    useAuth.mockReturnValue({
      logout,
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
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminLayout title="Dashboard">
                <span />
              </AdminLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: 'Accounts' })).not.toBeInTheDocument()

    const monitoringToggle = screen.getByRole('button', { name: /Monitoring/i })
    fireEvent.click(monitoringToggle)
    expect(monitoringToggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(monitoringToggle)
    expect(monitoringToggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('tolerates corrupt collapsed-nav localStorage', () => {
    localStorage.setItem('sg-admin-nav-collapsed', '{not-json')
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminLayout title="Dashboard">
                <span />
              </AdminLayout>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })
})
