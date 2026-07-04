import { useCallback, useRef, useState } from 'react'
import { api, type ConnectionEvent } from '../api/client'
import { formatApiError } from '../utils/apiError'

export function useConnectionEvents(componentId: string) {
  const [events, setEvents] = useState<ConnectionEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const requestIdRef = useRef(0)

  const reset = useCallback(() => {
    requestIdRef.current += 1
    setEvents([])
    setError(null)
    setLoading(false)
    setTotal(0)
    setHasMore(false)
  }, [])

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)
    setError(null)

    try {
      const response = await api.listConnectionEvents(componentId, 50)
      if (requestId !== requestIdRef.current) return
      setEvents(response.items)
      setTotal(response.total)
      setHasMore(response.has_next)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(formatApiError(err, 'Failed to load connection events'))
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [componentId])

  return { events, loading, error, total, hasMore, load, reset }
}
