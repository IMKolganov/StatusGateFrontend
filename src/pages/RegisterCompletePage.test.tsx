import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterCompletePage } from './RegisterCompletePage'

const registrationStatus = vi.fn()

vi.mock('../api/client', () => ({
  api: {
    registrationStatus: (...args: unknown[]) => registrationStatus(...args),
  },
}))

vi.mock('../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))

vi.mock('../components/BrandLogo', () => ({
  BrandLogo: () => <div>logo</div>,
}))

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('RegisterCompletePage', () => {
  beforeEach(() => {
    registrationStatus.mockReset()
    registrationStatus.mockResolvedValue({ require_email_verification: false })
  })
  afterEach(() => cleanup())

  it('redirects to login without email state', async () => {
    render(
      <MemoryRouter initialEntries={['/register/complete']}>
        <Routes>
          <Route path="/register/complete" element={<RegisterCompletePage />} />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('login')).toBeInTheDocument()
  })

  it('shows account created when verification is not required', async () => {
    registrationStatus.mockResolvedValue({ require_email_verification: false })
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register/complete', state: { email: 'a@b.c' } }]}>
        <Routes>
          <Route path="/register/complete" element={<RegisterCompletePage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    expect(await screen.findByRole('heading', { name: /Account created/i })).toBeInTheDocument()
    expect(screen.getByText('a@b.c')).toBeInTheDocument()
  })

  it('shows confirm email when verification is required', async () => {
    registrationStatus.mockResolvedValue({ require_email_verification: true })
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register/complete', state: { email: 'a@b.c' } }]}>
        <Routes>
          <Route path="/register/complete" element={<RegisterCompletePage />} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    await waitFor(() => expect(screen.getByRole('heading', { name: /Confirm your email/i })).toBeInTheDocument())
  })
})
