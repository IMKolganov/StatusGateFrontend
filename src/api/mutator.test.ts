import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, customFetch } from './mutator'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('ApiError', () => {
  it('stores status, detail, and traceId', () => {
    const err = new ApiError('fail', 418, 'teapot', 'trace-1')
    expect(err.message).toBe('fail')
    expect(err.status).toBe(418)
    expect(err.detail).toBe('teapot')
    expect(err.traceId).toBe('trace-1')
  })
})

describe('customFetch', () => {
  it('unwraps successful envelope data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: true, message: 'ok', data: { id: 1 } })),
    )
    await expect(customFetch<{ id: number }>('/api/x')).resolves.toEqual({ id: 1 })
  })

  it('throws ApiError when envelope success is false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: false, message: 'Nope', data: { detail: 'bad', trace_id: 't1' } }, 400),
      ),
    )
    await expect(customFetch('/api/x')).rejects.toMatchObject({
      message: 'Nope',
      status: 400,
      detail: 'bad',
      traceId: 't1',
    })
  })

  it('throws ApiError for non-ok responses without envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Not found' }, 404)),
    )
    await expect(customFetch('/api/missing')).rejects.toMatchObject({
      message: 'Not found',
      status: 404,
    })
  })

  it('retries once after a successful refresh on 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, 401))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) } as Response)
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'ok', data: { ok: true } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(customFetch<{ ok: boolean }>('/api/secure')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/api/auth/refresh')
  })

  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('no body')
        },
      } as unknown as Response),
    )
    await expect(customFetch('/api/empty')).resolves.toBeUndefined()
  })

  it('sets JSON content-type for non-FormData bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, message: 'ok', data: { ok: true } }))
    vi.stubGlobal('fetch', fetchMock)
    await customFetch('/api/x', { method: 'POST', body: JSON.stringify({ a: 1 }) })
    const headers = fetchMock.mock.calls[0]![1].headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('returns raw JSON when the body is not an envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 7 })))
    await expect(customFetch<{ id: number }>('/api/raw')).resolves.toEqual({ id: 7 })
  })

  it('does not refresh-retry login 401s', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: 'bad creds' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    await expect(customFetch('/api/auth/login')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
