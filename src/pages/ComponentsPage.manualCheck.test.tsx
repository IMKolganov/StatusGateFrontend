import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CheckResult, MonitoredComponent } from '../api/client'
import { ComponentsPage } from './ComponentsPage'

const listMonitoredComponents = vi.fn()
const listProjects = vi.fn()
const listComponentKinds = vi.fn()
const listComponentGroups = vi.fn()
const getMonitoringSettings = vi.fn()
const runManualCheck = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    listMonitoredComponents: (...args: unknown[]) => listMonitoredComponents(...args) as unknown,
    listProjects: (...args: unknown[]) => listProjects(...args) as unknown,
    listComponentKinds: (...args: unknown[]) => listComponentKinds(...args) as unknown,
    listComponentGroups: (...args: unknown[]) => listComponentGroups(...args) as unknown,
    getMonitoringSettings: (...args: unknown[]) => getMonitoringSettings(...args) as unknown,
    runManualCheck: (...args: unknown[]) => runManualCheck(...args) as unknown,
    listCheckResults: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
  },
}))

vi.mock('../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../components/ConnectionEventsTimeline', () => ({
  ConnectionEventsTimeline: () => null,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...(actual as Record<string, unknown>),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  }
})

const component: MonitoredComponent = {
  id: '00000000-0000-4000-8000-000000000111',
  project_id: '00000000-0000-4000-8000-000000000001',
  component_kind_id: '00000000-0000-4000-8000-000000000002',
  name: 'Helsinki OpenVPN',
  slug: 'helsinki',
  description: null,
  environment: null,
  check_url: 'https://ifconfig.me/ip',
  check_method: 'GET',
  check_type: 'openvpn',
  check_config: { config_text: 'client\ndev tun\n' },
  speed_test_bytes: 524288,
  speed_test_url_template: null,
  speed_test_interval_seconds: 3600,
  speed_test_enabled: true,
  expected_status_code: 200,
  timeout_seconds: 60,
  poll_interval_seconds: 60,
  connection_mode: 'ephemeral',
  is_active: true,
  last_checked_at: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  latest_network_summary: null,
}

const manualResult: CheckResult = {
  id: '00000000-0000-4000-8000-000000000222',
  monitored_component_id: component.id,
  checked_at: '2026-08-09T12:00:00Z',
  outcome: 'up',
  latency_ms: 1200,
  http_status_code: null,
  error_message: null,
  details: {
    network: {
      ipv4_address: '10.8.0.2',
      speed_test: {
        ok: true,
        mbps: 81.5,
        bytes: 524288,
        duration_ms: 50,
        measured_at: '2026-08-09T12:00:00Z',
      },
      speed_test_upload: {
        ok: true,
        mbps: 18.2,
        bytes: 524288,
        duration_ms: 220,
        measured_at: '2026-08-09T12:00:01Z',
      },
      direct_speed_test: {
        ok: true,
        mbps: 210,
        bytes: 524288,
        duration_ms: 20,
        measured_at: '2026-08-09T11:00:00Z',
      },
      direct_speed_test_upload: {
        ok: true,
        mbps: 42,
        bytes: 524288,
        duration_ms: 90,
        measured_at: '2026-08-09T11:00:01Z',
      },
    },
  },
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('ComponentsPage manual check dual-path', () => {
  beforeEach(() => {
    listProjects.mockResolvedValue({
      items: [{ id: component.project_id, name: 'Demo', slug: 'demo', description: null, is_active: true }],
      total: 1,
    })
    listComponentKinds.mockResolvedValue({
      items: [{ id: component.component_kind_id, name: 'OpenVPN', slug: 'openvpn', description: null }],
      total: 1,
    })
    listMonitoredComponents.mockResolvedValue({ items: [component], total: 1 })
    listComponentGroups.mockResolvedValue({ items: [], total: 0 })
    getMonitoringSettings.mockResolvedValue({
      default_poll_interval_seconds: 60,
      scheduler_interval_seconds: 30,
      default_speed_test_url_template: 'https://speed.cloudflare.com/__down?bytes={bytes}',
      default_speed_test_interval_seconds: 3600,
    })
    runManualCheck.mockResolvedValue(manualResult)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows VPN upload and WAN speeds after Check now', async () => {
    render(<ComponentsPage />)
    await flush()

    expect(await screen.findByText('Helsinki OpenVPN')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check now' }))
    await flush()

    expect(runManualCheck).toHaveBeenCalledWith(component.id)
    expect(await screen.findByText(/Last check:/i)).toBeInTheDocument()
    expect(screen.getByText('VPN upload')).toBeInTheDocument()
    expect(screen.getByText(/18\.20 Mbps/)).toBeInTheDocument()
    expect(screen.getByText('WAN download')).toBeInTheDocument()
    expect(screen.getByText(/210\.00 Mbps/)).toBeInTheDocument()
    expect(screen.getByText('WAN upload')).toBeInTheDocument()
    expect(screen.getByText(/42\.00 Mbps/)).toBeInTheDocument()
  })
})
