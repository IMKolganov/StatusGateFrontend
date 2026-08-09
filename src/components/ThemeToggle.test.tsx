import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../brand/theme'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  cleanup()
})

describe('ThemeToggle', () => {
  it('toggles theme label on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = screen.getByRole('button', { name: /Switch to (dark|light) theme/i })
    const before = button.getAttribute('aria-label')
    fireEvent.click(button)
    expect(button.getAttribute('aria-label')).not.toBe(before)
  })
})
