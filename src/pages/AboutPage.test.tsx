import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AboutPage } from './AboutPage'

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

afterEach(() => cleanup())

describe('AboutPage', () => {
  it('renders about content for the brand', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /About StatusGate/i })).toBeInTheDocument()
    expect(screen.getByText(/open-source service status platform/i)).toBeInTheDocument()
  })
})
