import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectStatusPage } from './ProjectStatusPage'

const getPublicProjectStatus = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    getPublicProjectStatus: (...args: unknown[]) => getPublicProjectStatus(...args),
  },
}))

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../components/SystemStatusPanel', () => ({
  SystemStatusPanel: () => <div data-testid="system-status" />,
}))

vi.mock('../components/VpnNetworkDetails', () => ({
  VpnNetworkDetails: () => <div data-testid="vpn-details" />,
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('ProjectStatusPage', () => {
  beforeEach(() => {
    getPublicProjectStatus.mockReset()
  })

  afterEach(() => cleanup())

  it('loads project services', async () => {
    getPublicProjectStatus.mockResolvedValue({
      id: 'p1',
      name: 'Demo Project',
      slug: 'demo',
      description: 'Public demo',
      services: [
        {
          id: 's1',
          name: 'API',
          slug: 'api',
          component_kind: 'HTTP',
          environment: 'prod',
          description: null,
          status: 'up',
          latency_ms: 42,
          checked_at: '2026-08-09T12:00:00Z',
          network_summary: null,
        },
      ],
    })
    render(
      <MemoryRouter initialEntries={['/projects/demo']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Demo Project' })).toBeInTheDocument()
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText(/Operational/i)).toBeInTheDocument()
    expect(screen.getByTestId('system-status')).toBeInTheDocument()
  })

  it('renders nested service groups', async () => {
    getPublicProjectStatus.mockResolvedValue({
      id: 'p1',
      name: 'DataGate',
      slug: 'datagate',
      description: null,
      groups: [
        {
          id: 'g1',
          name: 'Helsinki 1',
          sort_order: 0,
          services: [
            {
              id: 's1',
              name: 'Helsinki OpenVPN',
              slug: 'helsinki-ovpn',
              component_kind: 'OpenVPN',
              environment: null,
              description: null,
              status: 'up',
              latency_ms: 10,
              checked_at: '2026-08-09T12:00:00Z',
              network_summary: null,
            },
          ],
        },
      ],
      services: [],
    })
    render(
      <MemoryRouter initialEntries={['/projects/datagate']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Helsinki 1' })).toBeInTheDocument()
    expect(screen.getByText('Helsinki OpenVPN')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    const { ApiError } = await import('../api/client')
    getPublicProjectStatus.mockRejectedValue(new ApiError('missing', 404))
    render(
      <MemoryRouter initialEntries={['/projects/missing']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    await waitFor(() => expect(screen.getByText('missing')).toBeInTheDocument())
  })
})
