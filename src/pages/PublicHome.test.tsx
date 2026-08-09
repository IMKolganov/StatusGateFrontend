import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicHome from './PublicHome'

const listPublicProjects = vi.fn()
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
    listPublicProjects: (...args: unknown[]) => listPublicProjects(...args),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => useAuth(),
}))

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../components/SystemStatusPanel', () => ({
  SystemStatusPanel: ({ slug }: { slug: string }) => <div data-testid={`status-${slug}`} />,
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('PublicHome', () => {
  beforeEach(() => {
    listPublicProjects.mockReset()
    useAuth.mockReturnValue({ account: null, loading: false })
  })

  afterEach(() => cleanup())

  it('renders empty state when there are no projects', async () => {
    listPublicProjects.mockResolvedValue([])
    render(
      <MemoryRouter>
        <PublicHome />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: /System status/i })).toBeInTheDocument()
    expect(screen.getByText(/No active projects yet/i)).toBeInTheDocument()
  })

  it('lists projects and welcome for signed-in admin', async () => {
    listPublicProjects.mockResolvedValue([
      { id: '1', name: 'Demo', slug: 'demo', description: 'desc' },
    ])
    useAuth.mockReturnValue({
      account: {
        id: 'a',
        email: 'admin@x.com',
        full_name: null,
        access_roles: ['admin'],
        is_totp_enabled: false,
        has_password: true,
        has_google: false,
      },
      loading: false,
    })
    render(
      <MemoryRouter>
        <PublicHome />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Demo' })).toBeInTheDocument()
    expect(screen.getByTestId('status-demo')).toBeInTheDocument()
    expect(screen.getByText(/Signed in as/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Admin panel/i })).toBeInTheDocument()
  })

  it('shows API errors', async () => {
    const { ApiError } = await import('../api/client')
    listPublicProjects.mockRejectedValue(new ApiError('load failed', 500))
    render(
      <MemoryRouter>
        <PublicHome />
      </MemoryRouter>,
    )
    await flush()
    await waitFor(() => expect(screen.getByText('load failed')).toBeInTheDocument())
  })
})
