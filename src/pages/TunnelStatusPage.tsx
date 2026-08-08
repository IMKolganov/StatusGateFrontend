import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type PublicTunnelMetrics } from '../api/client'
import { PublicLayout } from '../components/PublicLayout'
import { TunnelHealthChart } from '../components/TunnelHealthChart'
import { TunnelThroughputChart } from '../components/TunnelThroughputChart'
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

function formatMbps(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Number(value).toFixed(1)} Mbps`
}

function formatMs(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Number(value).toFixed(digits)} ms`
}

function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '—'
  const mb = value / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(value / 1024)} KB`
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

  const latestPoint = metrics?.points.length ? metrics.points[metrics.points.length - 1] : null
  const latest = metrics?.latest ?? null

  return (
    <PublicLayout>
      <div className="page-top">
        <Link to={slug ? `/projects/${slug}` : '/'} className="back-link">
          ← Current status
        </Link>
      </div>

      {loading && !metrics && <p className="muted">Loading tunnel diagnostics...</p>}
      {error && <div className="alert error">{error}</div>}

      {metrics && (
        <>
          <header className="page-header">
            <div className="page-header-row">
              <div>
                <p className="tunnel-live-badge">Live diagnostics · last {metrics.hours}h</p>
                <h1>{metrics.service_name}</h1>
                <p className="page-lead">
                  {metrics.component_kind}
                  {latest?.outcome ? ` · ${latest.outcome}` : latestPoint ? ` · ${latestPoint.outcome}` : ''}
                  {latest?.exit_ip ? ` · exit ${latest.exit_ip}` : ''}
                </p>
              </div>
              {updatedAt && (
                <span className="service-checked">Updated {updatedAt.toLocaleTimeString()}</span>
              )}
            </div>
          </header>

          <section className="tunnel-panel">
            <div className="tunnel-panel__intro">
              <h2>Current tunnel diagnostics</h2>
              <p className="muted">
                Full check snapshot: tunnel reachability, exit path, gateway quality, and download
                capacity through the VPN. Gateway ping is only the light health probe — throughput
                comes from full file downloads on a shared schedule.
              </p>
            </div>

            <div className="tunnel-diag-grid">
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Outcome</span>
                <strong>{latest?.outcome ?? latestPoint?.outcome ?? '—'}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Window uptime</span>
                <strong>
                  {latest?.uptime_percent != null ? `${Number(latest.uptime_percent).toFixed(1)}%` : '—'}
                </strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Exit IP</span>
                <strong className="tunnel-diag__mono">{latest?.exit_ip ?? '—'}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Connect time</span>
                <strong>{formatMs(latest?.connect_time_ms, 0)}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">HTTP probe</span>
                <strong>{formatMs(latest?.probe_latency_ms, 0)}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Gateway ping</span>
                <strong>{formatMs(latest?.gateway_ping_avg_ms)}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Jitter</span>
                <strong>{formatMs(latest?.gateway_ping_jitter_ms)}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Packet loss</span>
                <strong>
                  {latest?.gateway_ping_loss_percent != null
                    ? `${Number(latest.gateway_ping_loss_percent).toFixed(0)}%`
                    : '—'}
                </strong>
              </div>
              <div className="tunnel-diag tunnel-diag--wide">
                <span className="tunnel-summary__label">Download capacity</span>
                <strong>{formatMbps(latest?.download_mbps)}</strong>
                <span className="muted tunnel-diag__sub">
                  {latest?.speed_test_showing_last_success
                    ? 'Showing last successful full test (current cycle deferred / cached)'
                    : latest?.speed_test_ok === false
                      ? latest.speed_test_error || 'Speed test failed'
                      : latest?.download_bytes
                        ? `${formatBytes(latest.download_bytes)} in ${formatMs(latest.download_duration_ms, 0)}`
                        : 'Waiting for a full tunnel download test'}
                </span>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Avg (history)</span>
                <strong>{formatMbps(latest?.speed_test_avg_mbps)}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Min / max</span>
                <strong>
                  {latest?.speed_test_min_mbps != null && latest?.speed_test_max_mbps != null
                    ? `${Number(latest.speed_test_min_mbps).toFixed(0)}–${Number(latest.speed_test_max_mbps).toFixed(0)}`
                    : '—'}
                </strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Fresh tests (2h)</span>
                <strong>{latest?.fresh_speed_tests_in_window ?? 0}</strong>
              </div>
              <div className="tunnel-diag">
                <span className="tunnel-summary__label">Samples / events</span>
                <strong>
                  {metrics.points.length} / {metrics.events.length}
                </strong>
              </div>
            </div>
          </section>

          <section className="tunnel-panel tunnel-panel--throughput">
            <div className="tunnel-panel__intro">
              <h2>Throughput through the tunnel</h2>
              <p className="muted">
                Real download Mbps measured by pulling a payload through the VPN (not ICMP). Tests
                are rate-limited across services, so markers are sparse. Filled = fresh full test;
                hollow = cached / deferred while waiting for a free slot.
              </p>
            </div>

            <ul className="tunnel-legend" aria-label="Throughput chart legend">
              <li>
                <span
                  className="tunnel-legend__swatch tunnel-legend__swatch--throughput"
                  aria-hidden
                />
                <span>
                  <strong>Fresh download test</strong>
                  <span className="muted"> full file pull · Mbps capacity</span>
                </span>
              </li>
              <li>
                <span
                  className="tunnel-legend__swatch tunnel-legend__swatch--throughput-cached"
                  aria-hidden
                />
                <span>
                  <strong>Cached / deferred</strong>
                  <span className="muted"> last known Mbps while staggered</span>
                </span>
              </li>
            </ul>

            <TunnelThroughputChart
              points={metrics.points}
              rangeStart={metrics.range_start}
              rangeEnd={metrics.range_end}
            />
          </section>

          <section className="tunnel-panel">
            <div className="tunnel-panel__intro">
              <h2>Latency &amp; packet loss</h2>
              <p className="muted">
                Lightweight gateway ping each monitoring cycle — reachability and path quality to
                the VPN router. Useful for outages and jitter, not for megabit capacity.
              </p>
            </div>

            <ul className="tunnel-legend" aria-label="Latency chart legend">
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
                  <span className="muted"> red vertical bar</span>
                </span>
              </li>
              <li className="tunnel-legend__event">
                <span className="tunnel-legend__swatch tunnel-legend__swatch--event" aria-hidden />
                <span>
                  <strong>Connection event</strong>
                  <span className="muted"> connect / disconnect markers</span>
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
