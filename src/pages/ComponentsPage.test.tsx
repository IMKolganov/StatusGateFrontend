import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentsPage } from './ComponentsPage'

const listMonitoredComponents = vi.fn()
const listProjects = vi.fn()
const listComponentKinds = vi.fn()
const getMonitoringSettings = vi.fn()
const createMonitoredComponent = vi.fn()
const updateMonitoredComponent = vi.fn()
const deleteMonitoredComponent = vi.fn()
const purgeCheckHistory = vi.fn()

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
    listMonitoredComponents: (...args: unknown[]) => listMonitoredComponents(...args),
    listProjects: (...args: unknown[]) => listProjects(...args),
    listComponentKinds: (...args: unknown[]) => listComponentKinds(...args),
    getMonitoringSettings: (...args: unknown[]) => getMonitoringSettings(...args),
    createMonitoredComponent: (...args: unknown[]) => createMonitoredComponent(...args),
    updateMonitoredComponent: (...args: unknown[]) => updateMonitoredComponent(...args),
    deleteMonitoredComponent: (...args: unknown[]) => deleteMonitoredComponent(...args),
    purgeCheckHistory: (...args: unknown[]) => purgeCheckHistory(...args),
    runManualCheck: vi.fn(),
    listCheckResults: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
    getSpeedTestAdvisory: vi.fn(() => Promise.resolve({ warning: null })),
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

vi.mock('../components/ConnectionEventsTimeline', () => ({
  ConnectionEventsTimeline: () => null,
}))

vi.mock('../components/CheckDiagnostics', () => ({
  CheckDiagnostics: () => null,
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('ComponentsPage', () => {
  beforeEach(() => {
    listMonitoredComponents.mockReset()
    listProjects.mockReset()
    listComponentKinds.mockReset()
    getMonitoringSettings.mockReset()
    createMonitoredComponent.mockReset()
    updateMonitoredComponent.mockReset()
    deleteMonitoredComponent.mockReset()
    purgeCheckHistory.mockReset()

    listProjects.mockResolvedValue({
      items: [{ id: 'p1', name: 'Demo', slug: 'demo', description: null, is_active: true }],
      total: 1,
    })
    listComponentKinds.mockResolvedValue({
      items: [
        { id: 'k1', name: 'HTTP', slug: 'http', description: null },
        { id: 'k2', name: 'OpenVPN', slug: 'openvpn', description: null },
        { id: 'k3', name: 'Xray', slug: 'xray', description: null },
      ],
      total: 3,
    })
    updateMonitoredComponent.mockResolvedValue({})
    deleteMonitoredComponent.mockResolvedValue(undefined)
    purgeCheckHistory.mockResolvedValue({ deleted_count: 3 })
    listMonitoredComponents.mockResolvedValue({
      items: [
        {
          id: 'c1',
          project_id: 'p1',
          component_kind_id: 'k1',
          name: 'Website',
          slug: 'website',
          description: null,
          environment: null,
          check_url: 'https://example.com',
          check_method: 'GET',
          check_type: 'http_status',
          check_config: null,
          speed_test_bytes: null,
          speed_test_url_template: null,
          speed_test_interval_seconds: null,
          speed_test_enabled: false,
          expected_status_code: 200,
          timeout_seconds: 30,
          poll_interval_seconds: 60,
          connection_mode: null,
          is_active: true,
          last_checked_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          latest_network_summary: null,
        },
      ],
      total: 1,
    })
    getMonitoringSettings.mockResolvedValue({
      default_poll_interval_seconds: 60,
      scheduler_interval_seconds: 30,
      default_speed_test_url_template: 'https://speed.cloudflare.com/__down?bytes={bytes}',
      default_speed_test_interval_seconds: 3600,
      updated_at: '2026-01-01T00:00:00Z',
    })
    createMonitoredComponent.mockResolvedValue({})
  })

  afterEach(() => cleanup())

  it('lists services and creates a new HTTP service', async () => {
    render(
      <MemoryRouter>
        <ComponentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Services' })).toBeInTheDocument()
    expect(screen.getByText('Website')).toBeInTheDocument()

    const formHeading = await screen.findByRole('heading', { name: 'Add service' })
    const formSection = formHeading.closest('section')!
    const form = within(formSection)

    fireEvent.change(form.getByLabelText(/^Type$/i), { target: { value: 'k1' } })
    fireEvent.change(form.getByPlaceholderText('Norway OpenVPN'), { target: { value: 'API Gateway' } })
    fireEvent.change(form.getByLabelText(/^Check URL$/i), {
      target: { value: 'https://api.example.com/health' },
    })
    fireEvent.click(form.getByRole('button', { name: 'Add service' }))
    await flush()
    await waitFor(() =>
      expect(createMonitoredComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'API Gateway',
          project_id: 'p1',
          component_kind_id: 'k1',
          check_url: 'https://api.example.com/health',
        }),
      ),
    )
  })

  it('requires VPN config when creating an OpenVPN service', async () => {
    render(
      <MemoryRouter>
        <ComponentsPage />
      </MemoryRouter>,
    )
    await flush()

    const formHeading = await screen.findByRole('heading', { name: 'Add service' })
    const formSection = formHeading.closest('section')!
    const form = within(formSection)
    fireEvent.change(form.getByLabelText(/^Type$/i), { target: { value: 'k2' } })
    fireEvent.change(form.getByPlaceholderText('Norway OpenVPN'), { target: { value: 'Helsinki VPN' } })
    expect(form.getByLabelText(/OpenVPN config/i)).toBeInTheDocument()

    // Bypass HTML required so our validation branch runs
    const formEl = formSection.querySelector('form')!
    fireEvent.submit(formEl)
    await flush()

    expect(await screen.findByText(/Paste an OpenVPN/i)).toBeInTheDocument()
    expect(createMonitoredComponent).not.toHaveBeenCalled()
  })

  it('creates an OpenVPN service with config and speed-test fields', async () => {
    render(
      <MemoryRouter>
        <ComponentsPage />
      </MemoryRouter>,
    )
    await flush()

    const formHeading = await screen.findByRole('heading', { name: 'Add service' })
    const form = within(formHeading.closest('section')!)
    fireEvent.change(form.getByLabelText(/^Type$/i), { target: { value: 'k2' } })
    fireEvent.change(form.getByPlaceholderText('Norway OpenVPN'), { target: { value: 'Helsinki VPN' } })
    fireEvent.change(form.getByLabelText(/OpenVPN config/i), {
      target: { value: 'client\ndev tun\n' },
    })
    fireEvent.click(form.getByRole('button', { name: 'Add service' }))
    await flush()

    await waitFor(() =>
      expect(createMonitoredComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Helsinki VPN',
          check_type: 'openvpn',
          check_config: { config_text: 'client\ndev tun' },
          connection_mode: 'ephemeral',
        }),
      ),
    )
  })

  it('edits and deletes an existing service', async () => {
    render(
      <MemoryRouter>
        <ComponentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('Website')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(await screen.findByRole('heading', { name: 'Edit service' })).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Website'), { target: { value: 'Website v2' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    await flush()

    await waitFor(() =>
      expect(updateMonitoredComponent).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ name: 'Website v2', slug: 'website' }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))
    await flush()
    await waitFor(() => expect(deleteMonitoredComponent).toHaveBeenCalledWith('c1'))
  })

  it('clears check history when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <MemoryRouter>
        <ComponentsPage />
      </MemoryRouter>,
    )
    await flush()
    fireEvent.click(await screen.findByRole('button', { name: /Clear history/i }))
    await flush()
    await waitFor(() => expect(purgeCheckHistory).toHaveBeenCalledWith('c1'))
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Deleted 3/))
  })
})
