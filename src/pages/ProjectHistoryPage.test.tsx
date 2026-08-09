import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectHistoryPage } from './ProjectHistoryPage'

const getPublicProjectHistory = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    getPublicProjectHistory: (...args: unknown[]) => getPublicProjectHistory(...args),
  },
}))

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('ProjectHistoryPage', () => {
  beforeEach(() => {
    getPublicProjectHistory.mockReset()
  })
  afterEach(() => cleanup())

  it('shows empty history', async () => {
    getPublicProjectHistory.mockResolvedValue({
      project_id: 'p1',
      project_name: 'Demo',
      project_slug: 'demo',
      days: [],
    })
    render(
      <MemoryRouter initialEntries={['/projects/demo/history']}>
        <Routes>
          <Route path="/projects/:slug/history" element={<ProjectHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Demo' })).toBeInTheDocument()
    expect(screen.getByText(/No incidents recorded yet/i)).toBeInTheDocument()
  })

  it('renders incident entries', async () => {
    getPublicProjectHistory.mockResolvedValue({
      project_id: 'p1',
      project_name: 'Demo',
      project_slug: 'demo',
      days: [
        {
          date: '2026-08-01',
          day: 1,
          month_label: 'August 2026',
          weekday_label: 'Sat',
          entries: [
            {
              update_id: 'u1',
              title: 'Outage',
              message: 'Investigating VPN',
              status: 'investigating',
              posted_at: '2026-08-01T10:00:00Z',
              service_name: 'Helsinki',
              starts_at: '2026-08-01T09:00:00Z',
              ends_at: null,
            },
          ],
        },
      ],
    })
    render(
      <MemoryRouter initialEntries={['/projects/demo/history']}>
        <Routes>
          <Route path="/projects/:slug/history" element={<ProjectHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Outage' })).toBeInTheDocument()
    expect(screen.getByText(/Investigating VPN/i)).toBeInTheDocument()
  })

  it('shows load errors', async () => {
    const { ApiError } = await import('../api/client')
    getPublicProjectHistory.mockRejectedValue(new ApiError('history failed', 500))
    render(
      <MemoryRouter initialEntries={['/projects/demo/history']}>
        <Routes>
          <Route path="/projects/:slug/history" element={<ProjectHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    await waitFor(() => expect(screen.getByText('history failed')).toBeInTheDocument())
  })
})
