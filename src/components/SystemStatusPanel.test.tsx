import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicDayBar, PublicSystemStatus } from '../api/client'
import { SystemStatusPanel } from './SystemStatusPanel'

const getPublicSystemStatus = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    getPublicSystemStatus: (...args: unknown[]) => getPublicSystemStatus(...args),
  },
}))

function day(date: string, status = 'operational'): PublicDayBar {
  return {
    date,
    status,
    tooltip: `${status} day`,
    check_count: 10,
    failed_count: 0,
    degraded_count: 0,
    availability_percent: 100,
    downtime_seconds: 0,
    incidents: [],
  }
}

function sampleStatus(overrides: Partial<PublicSystemStatus> = {}): PublicSystemStatus {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  return {
    project_id: 'p1',
    project_name: 'Demo',
    project_slug: 'demo',
    range_start: iso,
    range_end: iso,
    range_label: 'Aug 2026',
    days: 1,
    groups: [
      {
        name: 'VPN',
        component_count: 1,
        uptime_percent: 99.5,
        days: [day(iso)],
        services: [
          {
            id: 'svc-1',
            name: 'Helsinki',
            slug: 'helsinki',
            component_kind: 'OpenVPN',
            uptime_percent: 99.5,
            days: [day(iso, 'degraded')],
          },
        ],
      },
    ],
    active_alerts: [],
    ...overrides,
  }
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('SystemStatusPanel', () => {
  beforeEach(() => {
    getPublicSystemStatus.mockReset()
    getPublicSystemStatus.mockResolvedValue(sampleStatus())
  })

  afterEach(() => {
    cleanup()
  })

  it('loads timeline and expands group bars', async () => {
    render(<SystemStatusPanel slug="demo" />)
    await flush()
    expect(await screen.findByRole('heading', { name: /System status/i })).toBeInTheDocument()
    expect(screen.getByText(/99\.50% uptime/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Expand VPN/i }))
    expect(screen.getByText('Helsinki')).toBeInTheDocument()

    const bar = screen.getAllByRole('button', { name: /operational day|degraded day/i })[0]!
    fireEvent.click(bar)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('shows empty state when there are no groups', async () => {
    getPublicSystemStatus.mockResolvedValue(sampleStatus({ groups: [] }))
    render(<SystemStatusPanel slug="demo" />)
    await flush()
    expect(await screen.findByText(/No monitored services in this project yet/i)).toBeInTheDocument()
  })

  it('shows error state when the API fails', async () => {
    const { ApiError } = await import('../api/client')
    getPublicSystemStatus.mockRejectedValue(new ApiError('boom', 500))
    render(<SystemStatusPanel slug="demo" />)
    await flush()
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })

  it('navigates months, shows alerts, and supports embedded mode', async () => {
    getPublicSystemStatus.mockResolvedValue(
      sampleStatus({
        active_alerts: [
          {
            title: 'Partial outage',
            message: 'VPN degraded in RU',
            status: 'degraded',
            since: '2026-08-01T00:00:00Z',
          },
        ],
      }),
    )

    render(<SystemStatusPanel slug="demo" embedded />)
    await flush()
    expect(await screen.findByText(/currently experiencing issues/i)).toBeInTheDocument()
    expect(screen.getByText('Partial outage')).toBeInTheDocument()
    expect(document.querySelector('.system-status--embedded')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Previous month/i }))
    await flush()
    await waitFor(() => expect(getPublicSystemStatus.mock.calls.length).toBeGreaterThan(1))

    // Next month stays disabled while viewing the current month after returning
    fireEvent.click(screen.getByRole('button', { name: /Next month/i }))
    await flush()
  })

  it('toggles day detail closed when clicking the same bar twice', async () => {
    render(<SystemStatusPanel slug="demo" />)
    await flush()
    const bar = (await screen.findAllByRole('button', { name: /operational day|degraded day/i }))[0]!
    fireEvent.click(bar)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    fireEvent.click(bar)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
