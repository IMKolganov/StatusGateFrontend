import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectsPage } from './ProjectsPage'

const listProjects = vi.fn()
const createProject = vi.fn()
const updateProject = vi.fn()
const deleteProject = vi.fn()

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
    createProject: (...args: unknown[]) => createProject(...args),
    updateProject: (...args: unknown[]) => updateProject(...args),
    deleteProject: (...args: unknown[]) => deleteProject(...args),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    account: {
      id: '1',
      email: 'a@x.com',
      full_name: null,
      access_roles: ['admin'],
      is_totp_enabled: false,
      has_password: true,
      has_google: false,
    },
  }),
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

describe('ProjectsPage', () => {
  beforeEach(() => {
    listProjects.mockReset()
    createProject.mockReset()
    updateProject.mockReset()
    deleteProject.mockReset()
    listProjects.mockResolvedValue({
      items: [
        {
          id: 'p1',
          name: 'Demo',
          slug: 'demo',
          description: null,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })
    createProject.mockResolvedValue({})
    updateProject.mockResolvedValue({})
    deleteProject.mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('lists projects and creates a new one', async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Demo')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'New Project' } })
    fireEvent.click(screen.getByRole('button', { name: /Create project/i }))
    await flush()
    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Project', slug: 'new-project' }),
      ),
    )
  })

  it('edits and deletes a project', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    await flush()

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(screen.getByRole('heading', { name: 'Edit project' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Demo Renamed' } })
    fireEvent.change(screen.getByLabelText(/^Description$/i), { target: { value: 'Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }))
    await flush()

    await waitFor(() =>
      expect(updateProject).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          name: 'Demo Renamed',
          slug: 'demo',
          description: 'Updated',
        }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))
    await flush()
    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith('p1'))
  })

  it('shows save errors', async () => {
    const { ApiError } = await import('../api/client')
    createProject.mockRejectedValueOnce(new ApiError('taken', 400))
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    )
    await flush()
    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Dup' } })
    fireEvent.click(screen.getByRole('button', { name: /Create project/i }))
    await flush()
    expect(await screen.findByText('taken')).toBeInTheDocument()
  })
})
