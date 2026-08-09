import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MonitoringSettingsPage } from './MonitoringSettingsPage'

const getMonitoringSettings = vi.fn()
const getSpeedTestAdvisory = vi.fn()
const updateMonitoringSettings = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  DEFAULT_SPEED_TEST_URL_TEMPLATE: 'https://speed.cloudflare.com/__down?bytes={bytes}',
  api: {
    getMonitoringSettings: (...args: unknown[]) => getMonitoringSettings(...args),
    getSpeedTestAdvisory: (...args: unknown[]) => getSpeedTestAdvisory(...args),
    updateMonitoringSettings: (...args: unknown[]) => updateMonitoringSettings(...args),
  },
}))

vi.mock('../components/AdminLayout', () => ({
  AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

const settings = {
  default_poll_interval_seconds: 60,
  scheduler_interval_seconds: 30,
  default_speed_test_url_template: 'https://speed.cloudflare.com/__down?bytes={bytes}',
  default_speed_test_interval_seconds: 3600,
  updated_at: '2026-08-01T00:00:00Z',
}

describe('MonitoringSettingsPage', () => {
  beforeEach(() => {
    getMonitoringSettings.mockReset()
    getSpeedTestAdvisory.mockReset()
    updateMonitoringSettings.mockReset()
    getMonitoringSettings.mockResolvedValue(settings)
    getSpeedTestAdvisory.mockResolvedValue({
      warning: null,
      active_vpn_service_count: 2,
      estimated_speed_tests_per_minute: 1.5,
    })
    updateMonitoringSettings.mockResolvedValue({
      ...settings,
      default_poll_interval_seconds: 90,
      updated_at: '2026-08-02T00:00:00Z',
    })
  })

  afterEach(() => cleanup())

  it('loads polling settings form', async () => {
    render(
      <MemoryRouter>
        <MonitoringSettingsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Monitoring' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Default service poll interval/i)).toHaveValue(60)
    expect(screen.getAllByRole('button', { name: /Save settings/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/2 active VPN service/i)).toBeInTheDocument()
  })

  it('saves settings and shows success', async () => {
    render(
      <MemoryRouter>
        <MonitoringSettingsPage />
      </MemoryRouter>,
    )
    await flush()

    fireEvent.change(screen.getByLabelText(/Default service poll interval/i), {
      target: { value: '90' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: /Save settings/i })[0]!)
    await flush()

    await waitFor(() =>
      expect(updateMonitoringSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          default_poll_interval_seconds: 90,
          scheduler_interval_seconds: 30,
        }),
      ),
    )
    expect(await screen.findByText(/Settings saved/i)).toBeInTheDocument()
  })

  it('blocks save when the URL template is invalid', async () => {
    render(
      <MemoryRouter>
        <MonitoringSettingsPage />
      </MemoryRouter>,
    )
    await flush()

    fireEvent.change(screen.getByLabelText(/Default speed test URL template/i), {
      target: { value: 'http://insecure.example/down?bytes={bytes}' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: /Save settings/i })[1]!)
    await flush()

    expect(await screen.findByText('Speed test URL must use HTTPS.')).toBeInTheDocument()
    expect(updateMonitoringSettings).not.toHaveBeenCalled()
  })

  it('shows advisory warnings and load/save errors', async () => {
    getSpeedTestAdvisory.mockResolvedValueOnce({
      warning: 'Rate limit risk',
      active_vpn_service_count: 0,
      estimated_speed_tests_per_minute: 0,
    })
    render(
      <MemoryRouter>
        <MonitoringSettingsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('Rate limit risk')).toBeInTheDocument()

    const { ApiError } = await import('../api/client')
    updateMonitoringSettings.mockRejectedValueOnce(new ApiError('nope', 500))
    fireEvent.click(screen.getAllByRole('button', { name: /Save settings/i })[0]!)
    await flush()
    expect(await screen.findByText('nope')).toBeInTheDocument()
  })

  it('shows load errors', async () => {
    const { ApiError } = await import('../api/client')
    getMonitoringSettings.mockRejectedValueOnce(new ApiError('offline', 503))
    render(
      <MemoryRouter>
        <MonitoringSettingsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('offline')).toBeInTheDocument()
  })
})
