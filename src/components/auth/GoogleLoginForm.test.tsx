import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GoogleLoginForm } from './GoogleLoginForm'

const googleLogin = vi.fn()

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    googleLogin: (...args: unknown[]) => googleLogin(...args),
  },
}))

afterEach(() => {
  cleanup()
  delete window.google
  document.getElementById('google-identity-script')?.remove()
})

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('GoogleLoginForm', () => {
  beforeEach(() => {
    googleLogin.mockReset()
  })

  it('shows configuration error when clientId is missing', async () => {
    render(<GoogleLoginForm clientId="" onSuccess={vi.fn()} onMfaRequired={vi.fn()} />)
    await flush()
    expect(await screen.findByText(/Google client ID is not configured/i)).toBeInTheDocument()
  })

  it('initializes Google Identity and handles MFA path', async () => {
    let callback: ((response: { credential?: string }) => void) | undefined
    const renderButton = vi.fn((el: HTMLElement) => {
      el.textContent = 'GoogleBtn'
    })
    window.google = {
      accounts: {
        id: {
          initialize: (config) => {
            callback = config.callback
          },
          renderButton,
        },
      },
    }

    const existing = document.createElement('script')
    existing.id = 'google-identity-script'
    document.body.appendChild(existing)

    googleLogin.mockResolvedValue({ mfa_required: true, mfa_token: 'mfa-1' })
    const onSuccess = vi.fn()
    const onMfaRequired = vi.fn()

    render(<GoogleLoginForm clientId="client-123" onSuccess={onSuccess} onMfaRequired={onMfaRequired} />)
    await flush()
    await waitFor(() => expect(renderButton).toHaveBeenCalled())

    await act(async () => {
      callback?.({ credential: 'id-token' })
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(googleLogin).toHaveBeenCalledWith('id-token')
    expect(onMfaRequired).toHaveBeenCalledWith('mfa-1')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
