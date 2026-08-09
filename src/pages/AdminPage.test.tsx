import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminPage } from './AdminPage'

const dashboard = vi.fn()

vi.mock('../api/client', () => ({
  api: {
    dashboard: (...args: unknown[]) => dashboard(...args),
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

describe('AdminPage', () => {
  beforeEach(() => {
    dashboard.mockReset()
    dashboard.mockResolvedValue({
      message: 'Welcome back',
      account: { email: 'admin@example.com' },
    })
  })

  afterEach(() => cleanup())

  it('loads dashboard welcome and quick links', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
  })
})
