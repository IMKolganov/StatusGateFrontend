import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type PublicTunnelMetrics } from '../api/client'
import { PublicLayout } from '../components/PublicLayout'
import { TunnelHealthChart } from '../components/TunnelHealthChart'
import './public.css'

const POLL_MS = 15_000

const EVENT_LABELS: Record<string, string> = {
  tunnel_up: 'Connected',
  tunnel_down: 'Disconnected',
  reconnect: 'Reconnecting',
  connect_failed: 'Connect failed',
  unavailable: 'Internet unavailable',
  available: 'Internet restored',
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function TunnelStatusPage() {
  const { slug, serviceSlug } = useParams<{ slug: string; serviceSlug: string }>()
  const [metrics, setMetrics] = useState<PublicTunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!slug || !serviceSlug) return

    let cancelled = false
    let timer: number | undefined

    const load = async () => {
      try {
        const next = await api.getPublicTunnelMetrics(slug, serviceSlug, { hours: 2 })
        if (cancelled) return
        setMetrics(next)
        setError(null)
        setUpdatedAt(new Date())
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load tunnel metrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const schedule = () => {
      if (cancelled) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (cancelled) return
        if (document.visibilityState === 'visible') {
          void load().finally(schedule)
        } else {
          schedule()
        }
      }, POLL_MS)
    }

    const onVisibility = () => {
      if (cancelled) return
      if (document.visibilityState === 'visible') {
        void load()
      }
    }

    void load().finally(schedule)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [slug, serviceSlug])

  const latest = metrics?.points.length ? metrics.points[metrics.points.length - 1] : null

  return (
    <PublicLayout>
      <div className="page-top">
        <Link to={slug ? `/projects/${slug}` : '/'} className="back-link">
          ← Current status
        </Link>
      </div>

      {loading && !metrics && <p className="muted">Loading tunnel live view...</p>}
      {error && <div className="alert error">{error}</div>}

      {metrics && (
        <>
          <header className="page-header">
            <div className="page-header-row">
              <div>
                <p className="tunnel-live-badge">Live · last {metrics.hours}h</p>
                <h1>{metrics.service_name}</h1>
                <p className="page-lead">
                  {metrics.component_kind}
                  {latest ? ` · ${latest.outcome}` : ''}
                  {latest?.gateway_ping_avg_ms != null
                    ? ` · gateway ${Number(latest.gateway_ping_avg_ms).toFixed(1)} ms`
                    : ''}
                </p>
              </div>
              {updatedAt && (
                <span className="service-checked">Updated {updatedAt.toLocaleTimeString()}</span>
              )}
            </div>
          </header>

          <section className="tunnel-panel">
            <div className="tunnel-legend">
              <span className="tunnel-legend__ping">Gateway ping</span>
              <span className="tunnel-legend__loss">Packet loss</span>
              <span className="tunnel-legend__event">Connection events</span>
            </div>
            <TunnelHealthChart
              points={metrics.points}
              events={metrics.events}
              rangeStart={metrics.range_start}
              rangeEnd={metrics.range_end}
            />
          </section>

          <section className="tunnel-events">
            <h2>Connection events</h2>
            {metrics.events.length === 0 ? (
              <p className="muted">No connection events in this window.</p>
            ) : (
              <ul className="tunnel-events__list">
                {[...metrics.events].reverse().map((event) => (
                  <li key={`${event.event_type}-${event.occurred_at}`}>
                    <span className={`tunnel-event-type tunnel-event-type--${event.event_type}`}>
                      {EVENT_LABELS[event.event_type] ?? event.event_type}
                    </span>
                    <span className="tunnel-event-time">{formatWhen(event.occurred_at)}</span>
                    {event.message && <span className="tunnel-event-msg">{event.message}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PublicLayout>
  )
}
