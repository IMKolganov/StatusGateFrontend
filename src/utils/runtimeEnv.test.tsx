import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * runtimeEnv reads `window.__ENV__`; keep this in the jsdom project via .tsx name
 * even though it has no JSX.
 */
afterEach(() => {
  vi.resetModules()
  delete (window as Window & { __ENV__?: unknown }).__ENV__
})

describe('getRuntimeEnv', () => {
  it('prefers runtime window.__ENV__ over build-time env', async () => {
    ;(window as Window & { __ENV__?: Record<string, unknown> }).__ENV__ = {
      VITE_GOOGLE_CLIENT_ID: '  runtime-client  ',
    }
    const { getRuntimeEnv } = await import('./runtimeEnv')
    expect(getRuntimeEnv().googleClientId).toBe('runtime-client')
  })

  it('falls back to build-time VITE_GOOGLE_CLIENT_ID when runtime is empty', async () => {
    ;(window as Window & { __ENV__?: Record<string, unknown> }).__ENV__ = {
      VITE_GOOGLE_CLIENT_ID: '   ',
    }
    const { getRuntimeEnv } = await import('./runtimeEnv')
    const buildId =
      typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
        ? String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim()
        : ''
    expect(getRuntimeEnv().googleClientId).toBe(buildId)
  })

  it('returns empty googleClientId when neither source provides a value', async () => {
    ;(window as Window & { __ENV__?: Record<string, unknown> }).__ENV__ = {}
    const { getRuntimeEnv } = await import('./runtimeEnv')
    const buildId =
      typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
        ? String(import.meta.env.VITE_GOOGLE_CLIENT_ID).trim()
        : ''
    expect(getRuntimeEnv().googleClientId).toBe(buildId)
  })
})
