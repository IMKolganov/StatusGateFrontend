import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../brand/theme'
import { SiteHeader } from './SiteHeader'

afterEach(() => {
  cleanup()
})

describe('SiteHeader', () => {
  it('toggles the mobile menu', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <SiteHeader>
            <a href="/">Home</a>
          </SiteHeader>
        </MemoryRouter>
      </ThemeProvider>,
    )

    const open = screen.getByRole('button', { name: /Open menu/i })
    fireEvent.click(open)
    expect(open).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: /Mobile navigation/i })).toHaveClass('is-open')
    expect(document.body.classList.contains('site-header-menu-open')).toBe(true)
  })
})
