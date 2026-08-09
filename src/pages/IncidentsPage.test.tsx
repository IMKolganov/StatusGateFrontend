import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IncidentsPage } from './IncidentsPage'

const listProjects = vi.fn()
const listProjectIncidents = vi.fn()
const listMonitoredComponents = vi.fn()
const createProjectIncident = vi.fn()
const updateIncident = vi.fn()
const addIncidentUpdate = vi.fn()
const updateIncidentUpdate = vi.fn()
const deleteIncident = vi.fn()
const deleteIncidentUpdate = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    listProjects: (...args: unknown[]) => listProjects(...args),
    listProjectIncidents: (...args: unknown[]) => listProjectIncidents(...args),
    listMonitoredComponents: (...args: unknown[]) => listMonitoredComponents(...args),
    createProjectIncident: (...args: unknown[]) => createProjectIncident(...args),
    updateIncident: (...args: unknown[]) => updateIncident(...args),
    addIncidentUpdate: (...args: unknown[]) => addIncidentUpdate(...args),
    updateIncidentUpdate: (...args: unknown[]) => updateIncidentUpdate(...args),
    deleteIncident: (...args: unknown[]) => deleteIncident(...args),
    deleteIncidentUpdate: (...args: unknown[]) => deleteIncidentUpdate(...args),
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

const incident = {
  id: 'i1',
  project_id: 'p1',
  title: 'VPN outage',
  status: 'investigating',
  monitored_component_id: null as string | null,
  service_name: null as string | null,
  starts_at: '2026-08-01T10:00:00Z',
  ends_at: null as string | null,
  updates: [
    {
      id: 'u1',
      message: 'Looking into it',
      status: 'investigating',
      posted_at: '2026-08-01T10:05:00Z',
    },
  ],
}

describe('IncidentsPage', () => {
  beforeEach(() => {
    listProjects.mockReset()
    listProjectIncidents.mockReset()
    listMonitoredComponents.mockReset()
    createProjectIncident.mockReset()
    updateIncident.mockReset()
    addIncidentUpdate.mockReset()
    updateIncidentUpdate.mockReset()
    deleteIncident.mockReset()
    deleteIncidentUpdate.mockReset()

    listProjects.mockResolvedValue({
      items: [
        { id: 'p1', name: 'Demo', slug: 'demo', description: null, is_active: true },
        { id: 'p2', name: 'Other', slug: 'other', description: null, is_active: true },
      ],
      total: 2,
    })
    listMonitoredComponents.mockResolvedValue({
      items: [
        {
          id: 'c1',
          name: 'Helsinki',
          project_id: 'p1',
          component_kind_id: 'k1',
          slug: 'helsinki',
        },
      ],
      total: 1,
    })
    listProjectIncidents.mockResolvedValue([{ ...incident }])
    createProjectIncident.mockResolvedValue({})
    updateIncident.mockResolvedValue({})
    addIncidentUpdate.mockResolvedValue({})
    updateIncidentUpdate.mockResolvedValue({})
    deleteIncident.mockResolvedValue(undefined)
    deleteIncidentUpdate.mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('loads incidents for the selected project', async () => {
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Incident history' })).toBeInTheDocument()
    expect(await screen.findByText('VPN outage')).toBeInTheDocument()
    expect(screen.getByText(/Looking into it/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New incident' })).toBeInTheDocument()
  })

  it('creates an incident and reloads the list', async () => {
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()

    const formHeading = await screen.findByRole('heading', { name: 'New incident' })
    const form = within(formHeading.closest('section')!)
    fireEvent.change(form.getByPlaceholderText(/Helsinki OpenVPN unavailable/i), {
      target: { value: 'New outage' },
    })
    fireEvent.change(form.getByPlaceholderText(/We are investigating/i), {
      target: { value: 'Investigating connectivity' },
    })
    fireEvent.change(form.getByLabelText(/^Service$/i), { target: { value: 'c1' } })
    fireEvent.click(form.getByRole('button', { name: /Publish incident/i }))
    await flush()

    await waitFor(() =>
      expect(createProjectIncident).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          title: 'New outage',
          message: 'Investigating connectivity',
          monitored_component_id: 'c1',
        }),
      ),
    )
    expect(listProjectIncidents.mock.calls.length).toBeGreaterThan(1)
  })

  it('edits incident metadata and deletes an incident', async () => {
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('VPN outage')).toBeInTheDocument()

    const panel = screen.getByText('VPN outage').closest('section')!
    const header = panel.querySelector('.incident-panel-header')!
    fireEvent.click(within(header as HTMLElement).getByRole('button', { name: /^Edit$/i }))
    const titleInput = within(panel).getByDisplayValue('VPN outage')
    fireEvent.change(titleInput, { target: { value: 'VPN outage updated' } })
    fireEvent.click(within(panel).getByRole('button', { name: /^Save$/i }))
    await flush()

    await waitFor(() =>
      expect(updateIncident).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({
          title: 'VPN outage updated',
          clear_monitored_component: true,
        }),
      ),
    )

    fireEvent.click(within(header as HTMLElement).getByRole('button', { name: /^Delete$/i }))
    await flush()
    await waitFor(() => expect(deleteIncident).toHaveBeenCalledWith('i1'))
  })

  it('adds, edits, and removes incident updates', async () => {
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('Looking into it')).toBeInTheDocument()

    const panel = screen.getByText('VPN outage').closest('section')!
    const addForm = within(panel).getByRole('heading', { name: 'Add update' }).closest('form')!
    fireEvent.change(within(addForm).getByPlaceholderText(/fully recovered/i), {
      target: { value: 'Still investigating' },
    })
    fireEvent.click(within(addForm).getByRole('button', { name: /Add update/i }))
    await flush()
    await waitFor(() =>
      expect(addIncidentUpdate).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({ message: 'Still investigating' }),
      ),
    )

    const updateRow = within(panel).getByText('Looking into it').closest('li')!
    fireEvent.click(within(updateRow).getByRole('button', { name: /^Edit$/i }))
    fireEvent.change(within(updateRow).getByDisplayValue('Looking into it'), {
      target: { value: 'Updated message' },
    })
    fireEvent.click(within(updateRow).getByRole('button', { name: /^Save$/i }))
    await flush()
    await waitFor(() =>
      expect(updateIncidentUpdate).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ message: 'Updated message' }),
      ),
    )

    fireEvent.click(within(updateRow).getByRole('button', { name: /^Remove$/i }))
    await flush()
    await waitFor(() => expect(deleteIncidentUpdate).toHaveBeenCalledWith('u1'))
  })

  it('shows create errors from the API', async () => {
    createProjectIncident.mockRejectedValueOnce(new Error('denied'))
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()
    const formHeading = await screen.findByRole('heading', { name: 'New incident' })
    const form = within(formHeading.closest('section')!)
    fireEvent.change(form.getByPlaceholderText(/Helsinki OpenVPN unavailable/i), {
      target: { value: 'Failing' },
    })
    fireEvent.change(form.getByPlaceholderText(/We are investigating/i), {
      target: { value: 'msg' },
    })
    fireEvent.click(form.getByRole('button', { name: /Publish incident/i }))
    await flush()
    expect(await screen.findByText(/denied|Save failed/i)).toBeInTheDocument()
  })

  it('clears state when switching projects', async () => {
    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByText('VPN outage')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Project$/i), { target: { value: 'p2' } })
    await flush()
    await waitFor(() => expect(listProjectIncidents).toHaveBeenCalledWith('p2'))
  })
})
