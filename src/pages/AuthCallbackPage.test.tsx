import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthCallbackPage } from './AuthCallbackPage'

const completeLogin = vi.fn()

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ completeLogin }),
}))

afterEach(() => {
  cleanup()
  completeLogin.mockReset()
})

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('AuthCallbackPage', () => {
  it('completes login and navigates home', async () => {
    completeLogin.mockResolvedValue(undefined)
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(/Completing sign in/i)).toBeInTheDocument()
    await flush()
    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument())
  })

  it('navigates to login on failure', async () => {
    completeLogin.mockRejectedValue(new Error('nope'))
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<div>login</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await flush()
    await waitFor(() => expect(screen.getByText('login')).toBeInTheDocument())
  })
})
