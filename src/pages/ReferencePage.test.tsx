import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReferencePage } from './ReferencePage'

vi.mock('../components/AdminLayout', () => ({
  AdminLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

afterEach(() => cleanup())

describe('ReferencePage', () => {
  it('links to service type catalogs', () => {
    render(
      <MemoryRouter>
        <ReferencePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Reference data' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Service types/i })).toBeInTheDocument()
  })
})
