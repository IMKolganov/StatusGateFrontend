import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PublicLayout } from './PublicLayout'

vi.mock('./PublicHeader', () => ({
  PublicHeader: () => <header>Header</header>,
}))

vi.mock('./PublicFooter', () => ({
  PublicFooter: () => <footer>Footer</footer>,
}))

describe('PublicLayout', () => {
  afterEach(() => cleanup())

  it('wraps children with header and footer', () => {
    render(
      <MemoryRouter>
        <PublicLayout>
          <p>Content</p>
        </PublicLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})
