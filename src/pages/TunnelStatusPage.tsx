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
    let requestId = 0

    const load = async () => {
      const currentRequest = ++requestId
      try {
        const next = await api.getPublicTunnelMetrics(slug, serviceSlug, { hours: 2 })
        if (cancelled || currentRequest !== requestId) return
        setMetrics(next)
        setError(null)
        setUpdatedAt(new Date())
      } catch (err: unknown) {
        if (cancelled || currentRequest !== requestId) return
        setError(err instanceof ApiError ? err.message : 'Failed to load tunnel metrics')
      } finally {
        if (!cancelled && currentRequest === requestId) setLoading(false)
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
            <div className="tunnel-panel__intro">
              <h2>Tunnel health</h2>
              <p className="muted">
                Gateway ping to the VPN router (left axis, ms) and packet loss from that ping
                (right axis, %). Vertical red bars are failed checks; dots on top are connect/disconnect events.
                Hover a point for exact values.
              </p>
            </div>

            <div className="tunnel-summary">
              <div className="tunnel-summary__item">
                <span className="tunnel-summary__label">Latest ping</span>
                <strong>
                  {latest?.gateway_ping_avg_ms != null
                    ? `${Number(latest.gateway_ping_avg_ms).toFixed(1)} ms`
                    : '—'}
                </strong>
              </div>
              <div className="tunnel-summary__item">
                <span className="tunnel-summary__label">Latest loss</span>
                <strong>
                  {latest?.gateway_ping_loss_percent != null
                    ? `${Number(latest.gateway_ping_loss_percent).toFixed(0)}%`
                    : '—'}
                </strong>
              </div>
              <div className="tunnel-summary__item">
                <span className="tunnel-summary__label">Samples</span>
                <strong>{metrics.points.length}</strong>
              </div>
              <div className="tunnel-summary__item">
                <span className="tunnel-summary__label">Events</span>
                <strong>{metrics.events.length}</strong>
              </div>
            </div>

            <ul className="tunnel-legend" aria-label="Chart legend">
              <li className="tunnel-legend__ping">
                <span className="tunnel-legend__swatch tunnel-legend__swatch--ping" aria-hidden />
                <span>
                  <strong>Gateway ping</strong>
                  <span className="muted"> solid line · left axis · milliseconds</span>
                </span>
              </li>
              <li className="tunnel-legend__loss">
                <span className="tunnel-legend__swatch tunnel-legend__swatch--loss" aria-hidden />
                <span>
                  <strong>Packet loss</strong>
                  <span className="muted"> dashed line · right axis · 0–100%</span>
                </span>
              </li>
              <li className="tunnel-legend__outage">
                <span className="tunnel-legend__swatch tunnel-legend__swatch--outage" aria-hidden />
                <span>
                  <strong>Failed check</strong>
                  <span className="muted"> red vertical bar (down / timeout / error)</span>
                </span>
              </li>
              <li className="tunnel-legend__event">
                <span className="tunnel-legend__swatch tunnel-legend__swatch--event" aria-hidden />
                <span>
                  <strong>Connection event</strong>
                  <span className="muted"> green = up, red = down / reconnect</span>
                </span>
              </li>
            </ul>

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
                {[...metrics.events].reverse().map((event, index) => (
                  <li key={event.id ?? `${event.event_type}-${event.occurred_at}-${index}`}>
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
