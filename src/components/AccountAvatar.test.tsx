import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountAvatar } from './AccountAvatar'

const getAccountAvatarUrl = vi.fn()

vi.mock('../utils/accountDisplay', () => ({
  getAccountAvatarUrl: (...args: unknown[]) => getAccountAvatarUrl(...args),
}))

const account = {
  id: '1',
  email: 'u@x.com',
  full_name: null,
  access_roles: ['user'] as string[],
  is_totp_enabled: false,
  has_password: true,
  has_google: false,
}

describe('AccountAvatar', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders nothing without an avatar URL', () => {
    getAccountAvatarUrl.mockReturnValue(null)
    const { container } = render(<AccountAvatar account={account} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the image after a successful probe load', async () => {
    getAccountAvatarUrl.mockReturnValue('https://cdn.example/a.png')

    const OriginalImage = globalThis.Image
    class FakeImage {
      referrerPolicy = ''
      onload: ((ev: Event) => void) | null = null
      onerror: ((ev: Event) => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.(new Event('load')))
      }
    }
    vi.stubGlobal('Image', FakeImage)

    render(<AccountAvatar account={account} className="avatar" />)
    await waitFor(() => {
      const img = document.querySelector('img.avatar')
      expect(img).toHaveAttribute('src', 'https://cdn.example/a.png')
    })

    vi.stubGlobal('Image', OriginalImage)
  })

  it('stays hidden when the probe errors', async () => {
    getAccountAvatarUrl.mockReturnValue('https://cdn.example/missing.png')

    class FakeImage {
      referrerPolicy = ''
      onload: ((ev: Event) => void) | null = null
      onerror: ((ev: Event) => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.(new Event('error')))
      }
    }
    vi.stubGlobal('Image', FakeImage)

    const { container } = render(<AccountAvatar account={account} />)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container).toBeEmptyDOMElement()
  })
})
