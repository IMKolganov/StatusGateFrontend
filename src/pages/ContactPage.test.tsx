import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactPage } from './ContactPage'

vi.mock('../components/PublicLayout', () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

afterEach(() => cleanup())

describe('ContactPage', () => {
  it('lists contact channels', () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'IMKolganov@gmail.com' })).toBeInTheDocument()
    expect(screen.getByText(/Feedback and contributions are welcome/i)).toBeInTheDocument()
  })
})
