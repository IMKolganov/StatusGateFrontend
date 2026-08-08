import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PublicFooter } from './PublicFooter'

describe('PublicFooter', () => {
  it('shows the app version', () => {
    render(<PublicFooter />)
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument()
  })
})
