import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentGroupsPage } from './ComponentGroupsPage'

const listProjects = vi.fn()
const listComponentGroups = vi.fn()
const createComponentGroup = vi.fn()
const updateComponentGroup = vi.fn()
const deleteComponentGroup = vi.fn()

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
    listComponentGroups: (...args: unknown[]) => listComponentGroups(...args),
    createComponentGroup: (...args: unknown[]) => createComponentGroup(...args),
    updateComponentGroup: (...args: unknown[]) => updateComponentGroup(...args),
    deleteComponentGroup: (...args: unknown[]) => deleteComponentGroup(...args),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ account: { id: 'a1', email: 'admin@example.com', roles: ['admin'] } }),
}))

vi.mock('../auth/roles', () => ({
  isAdmin: () => true,
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

describe('ComponentGroupsPage', () => {
  beforeEach(() => {
    listProjects.mockReset()
    listComponentGroups.mockReset()
    createComponentGroup.mockReset()
    updateComponentGroup.mockReset()
    deleteComponentGroup.mockReset()

    listProjects.mockResolvedValue({
      items: [{ id: 'p1', name: 'DataGate', slug: 'datagate', description: null, is_active: true }],
      total: 1,
    })
    listComponentGroups.mockResolvedValue({
      items: [
        {
          id: 'g1',
          project_id: 'p1',
          name: 'Server 1',
          slug: 'server-1',
          description: null,
          sort_order: 1,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })
    createComponentGroup.mockResolvedValue({
      id: 'g2',
      project_id: 'p1',
      name: 'Server 2',
      slug: 'server-2',
      description: null,
      sort_order: 2,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })
    updateComponentGroup.mockResolvedValue({})
    deleteComponentGroup.mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('lists groups and creates a new group', async () => {
    render(<ComponentGroupsPage />)
    await flush()

    expect(await screen.findByRole('heading', { name: 'Service groups' })).toBeInTheDocument()
    expect(screen.getByText('Server 1')).toBeInTheDocument()
    expect(listComponentGroups).toHaveBeenCalledWith('p1')

    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Server 2' } })
    fireEvent.change(screen.getByLabelText(/Sort order/i), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))
    await flush()

    await waitFor(() =>
      expect(createComponentGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'p1',
          name: 'Server 2',
          slug: 'server-2',
          sort_order: 2,
          is_active: true,
        }),
      ),
    )
  })

  it('edits and deletes an existing group', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ComponentGroupsPage />)
    await flush()
    expect(await screen.findByText('Server 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(await screen.findByRole('heading', { name: 'Edit group' })).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Server 1'), { target: { value: 'Helsinki 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await flush()

    await waitFor(() =>
      expect(updateComponentGroup).toHaveBeenCalledWith(
        'g1',
        expect.objectContaining({ name: 'Helsinki 1', slug: 'server-1' }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))
    await flush()
    await waitFor(() => expect(deleteComponentGroup).toHaveBeenCalledWith('g1'))
  })
})
