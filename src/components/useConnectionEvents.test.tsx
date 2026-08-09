import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listConnectionEvents = vi.fn()

vi.mock('../api/client', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  api: {
    listConnectionEvents: (...args: unknown[]) => listConnectionEvents(...args),
  },
}))

const { useConnectionEvents } = await import('./useConnectionEvents')

describe('useConnectionEvents', () => {
  beforeEach(() => {
    listConnectionEvents.mockReset()
  })

  it('loads events and exposes pagination flags', async () => {
    listConnectionEvents.mockResolvedValue({
      items: [{ id: 'e1', event_label: 'Connected' }],
      total: 3,
      has_next: true,
    })

    const { result } = renderHook(() => useConnectionEvents('c1'))

    await act(async () => {
      await result.current.load()
    })

    expect(listConnectionEvents).toHaveBeenCalledWith('c1', 50)
    expect(result.current.events).toHaveLength(1)
    expect(result.current.total).toBe(3)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('stores formatted errors when the API fails', async () => {
    listConnectionEvents.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useConnectionEvents('c1'))

    await act(async () => {
      await result.current.load()
    })

    expect(result.current.error).toMatch(/network down|Failed to load connection events/)
    expect(result.current.loading).toBe(false)
  })

  it('ignores stale responses after reset', async () => {
    let resolveFirst!: (value: unknown) => void
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    listConnectionEvents.mockReturnValueOnce(first)

    const { result } = renderHook(() => useConnectionEvents('c1'))

    let loadPromise!: Promise<void>
    act(() => {
      loadPromise = result.current.load()
    })

    act(() => {
      result.current.reset()
    })

    resolveFirst({
      items: [{ id: 'stale' }],
      total: 1,
      has_next: false,
    })
    await act(async () => {
      await loadPromise
    })

    expect(result.current.events).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('reset clears error and totals', async () => {
    listConnectionEvents.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useConnectionEvents('c1'))

    await act(async () => {
      await result.current.load()
    })
    expect(result.current.error).toBeTruthy()

    act(() => {
      result.current.reset()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.total).toBe(0)
    expect(result.current.hasMore).toBe(false)
  })

  it('ignores stale errors after a newer request starts', async () => {
    let rejectFirst!: (reason?: unknown) => void
    const first = new Promise((_resolve, reject) => {
      rejectFirst = reject
    })
    listConnectionEvents
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ items: [], total: 0, has_next: false })

    const { result } = renderHook(() => useConnectionEvents('c1'))

    let firstLoad!: Promise<void>
    act(() => {
      firstLoad = result.current.load()
    })

    await act(async () => {
      await result.current.load()
    })

    rejectFirst(new Error('stale'))
    await act(async () => {
      await firstLoad.catch(() => undefined)
    })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
})
