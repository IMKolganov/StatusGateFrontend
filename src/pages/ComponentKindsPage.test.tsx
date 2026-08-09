import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentKindsPage } from './ComponentKindsPage'

const listComponentKinds = vi.fn()
const createComponentKind = vi.fn()

vi.mock('../api/client', () => ({
  api: {
    listComponentKinds: (...args: unknown[]) => listComponentKinds(...args),
    createComponentKind: (...args: unknown[]) => createComponentKind(...args),
    updateComponentKind: vi.fn(),
    deleteComponentKind: vi.fn(),
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

describe('ComponentKindsPage', () => {
  beforeEach(() => {
    listComponentKinds.mockReset()
    createComponentKind.mockReset()
    listComponentKinds.mockResolvedValue({
      items: [{ id: 'k1', name: 'API', slug: 'api', description: 'HTTP APIs' }],
      total: 1,
    })
    createComponentKind.mockResolvedValue({})
  })

  afterEach(() => cleanup())

  it('lists kinds and creates a new type', async () => {
    render(
      <MemoryRouter>
        <ComponentKindsPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Service types' })).toBeInTheDocument()
    expect(screen.getByText('API')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('API'), { target: { value: 'Database' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await flush()
    await waitFor(() =>
      expect(createComponentKind).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Database', slug: 'database' }),
      ),
    )
  })
})
