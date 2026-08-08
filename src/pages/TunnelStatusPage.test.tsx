import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicTunnelMetrics } from '../api/tunnelMetrics'
import { TunnelStatusPage } from './TunnelStatusPage'

const getPublicTunnelMetrics = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    getPublicTunnelMetrics: (...args: unknown[]) => getPublicTunnelMetrics(...args),
  },
}))

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const sampleMetrics: PublicTunnelMetrics = {
  project_slug: 'demo',
  service_id: '00000000-0000-4000-8000-000000000001',
  service_name: 'Helsinki OpenVPN',
  service_slug: 'helsinki',
  component_kind: 'OpenVPN',
  range_start: '2026-08-08T10:00:00.000Z',
  range_end: '2026-08-08T12:00:00.000Z',
  hours: 2,
  latest: {
    checked_at: '2026-08-08T11:00:00.000Z',
    outcome: 'up',
    exit_ip: '203.0.113.10',
    connect_time_ms: 1200,
    probe_latency_ms: 90,
    gateway_ping_avg_ms: 30,
    gateway_ping_jitter_ms: 4,
    gateway_ping_loss_percent: 0,
    download_mbps: 114.6,
    download_bytes: 12_000_000,
    download_duration_ms: 840,
    speed_test_ok: true,
    speed_test_avg_mbps: 100.2,
    speed_test_min_mbps: 80,
    speed_test_max_mbps: 120,
    fresh_speed_tests_in_window: 2,
    uptime_percent: 100,
  },
  points: [
    {
      checked_at: '2026-08-08T11:00:00.000Z',
      outcome: 'up',
      gateway_ping_avg_ms: 30,
      gateway_ping_loss_percent: 0,
      download_mbps: 114.6,
      download_cached: false,
      download_bytes: 12_000_000,
      download_duration_ms: 840,
      exit_ip: '203.0.113.10',
    },
  ],
  events: [],
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('TunnelStatusPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getPublicTunnelMetrics.mockReset()
    getPublicTunnelMetrics.mockResolvedValue(sampleMetrics)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('loads full diagnostics and stops polling after unmount', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/projects/demo/services/helsinki/tunnel']}>
        <Routes>
          <Route path="/projects/:slug/services/:serviceSlug/tunnel" element={<TunnelStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await flushMicrotasks()
    expect(screen.getByRole('heading', { name: /Helsinki OpenVPN/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Current tunnel diagnostics/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Throughput through the tunnel/i })).toBeInTheDocument()
    expect(screen.getAllByText(/203\.0\.113\.10/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/114\.6 Mbps/i).length).toBeGreaterThanOrEqual(1)
    expect(getPublicTunnelMetrics).toHaveBeenCalledTimes(1)

    unmount()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000)
    })
    await flushMicrotasks()

    expect(getPublicTunnelMetrics).toHaveBeenCalledTimes(1)
  })

  it('polls again while mounted', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/demo/services/helsinki/tunnel']}>
        <Routes>
          <Route path="/projects/:slug/services/:serviceSlug/tunnel" element={<TunnelStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await flushMicrotasks()
    expect(screen.getByRole('heading', { name: /Helsinki OpenVPN/i })).toBeInTheDocument()
    expect(getPublicTunnelMetrics).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    await flushMicrotasks()

    expect(getPublicTunnelMetrics.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
