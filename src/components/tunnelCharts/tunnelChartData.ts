import type { PublicTunnelConnectionEvent, PublicTunnelMetricPoint } from '../../api/tunnelMetrics'

/** Outcomes that mean the tunnel responded; anything else is an outage sample. */
const HEALTHY_OUTCOMES = new Set(['up', 'degraded'])

/** Consecutive samples further apart than this factor of the median interval get a null gap. */
const GAP_FACTOR = 2.5

export type ChartEventMarker = {
  x: number
  eventType: string
  up: boolean
  label: string
  message: string | null
}

export type TunnelChartData = {
  /** [x, ping avg, jitter] */
  ping: (number | null)[][]
  /** [x, loss percent] */
  loss: (number | null)[][]
  /** [x, fresh mbps, cached mbps] */
  throughput: (number | null)[][]
  /** Unix seconds of samples whose outcome was an outage. */
  outages: number[]
  hasPing: boolean
  hasLoss: boolean
  /** Any download samples (fresh or cached) in the window. */
  speedSampleCount: number
  freshSpeedCount: number
}

export function isHealthyOutcome(outcome: string): boolean {
  return HEALTHY_OUTCOMES.has(outcome)
}

function toSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

type Row = {
  x: number
  ping: number | null
  jitter: number | null
  loss: number | null
  fresh: number | null
  cached: number | null
  isOutage: boolean
}

function toRow(point: PublicTunnelMetricPoint): Row {
  const isOutage = !isHealthyOutcome(point.outcome)

  const num = (value: number | null | undefined): number | null =>
    value != null && Number.isFinite(value) ? Number(value) : null

  let fresh: number | null = null
  let cached: number | null = null
  const mbps = num(point.download_mbps)
  if (!isOutage && mbps != null && mbps > 0) {
    if (point.download_cached === true) {
      cached = mbps
    } else {
      fresh = mbps
    }
  }

  return {
    x: toSeconds(point.checked_at),
    ping: isOutage ? null : num(point.gateway_ping_avg_ms),
    jitter: isOutage ? null : num(point.gateway_ping_jitter_ms),
    loss: isOutage ? null : num(point.gateway_ping_loss_percent),
    fresh,
    cached,
    isOutage,
  }
}

/**
 * Build aligned uPlot data for the three panels, inserting explicit null rows
 * into large time gaps so lines break instead of interpolating across holes.
 */
export function buildTunnelChartData(points: PublicTunnelMetricPoint[]): TunnelChartData {
  const rows = points.map(toRow).sort((a, b) => a.x - b.x)

  const deltas: number[] = []
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]
    const curr = rows[i]
    if (prev && curr) deltas.push(curr.x - prev.x)
  }
  const typicalDelta = median(deltas)

  const xs: number[] = []
  const ping: (number | null)[] = []
  const jitter: (number | null)[] = []
  const loss: (number | null)[] = []
  const fresh: (number | null)[] = []
  const cached: (number | null)[] = []
  const outages: number[] = []

  const pushNullRow = (x: number) => {
    xs.push(x)
    ping.push(null)
    jitter.push(null)
    loss.push(null)
    fresh.push(null)
    cached.push(null)
  }

  let prevX: number | null = null
  for (const row of rows) {
    if (
      prevX != null &&
      typicalDelta > 0 &&
      row.x - prevX > typicalDelta * GAP_FACTOR
    ) {
      pushNullRow(prevX + 1)
    }
    xs.push(row.x)
    ping.push(row.ping)
    jitter.push(row.jitter)
    loss.push(row.loss)
    fresh.push(row.fresh)
    cached.push(row.cached)
    if (row.isOutage) outages.push(row.x)
    prevX = row.x
  }

  const freshSpeedCount = fresh.filter((value) => value != null).length
  const cachedSpeedCount = cached.filter((value) => value != null).length

  return {
    ping: [xs, ping, jitter],
    loss: [xs, loss],
    throughput: [xs, fresh, cached],
    outages,
    hasPing: ping.some((value) => value != null),
    hasLoss: loss.some((value) => value != null),
    speedSampleCount: freshSpeedCount + cachedSpeedCount,
    freshSpeedCount,
  }
}

const EVENT_LABELS: Record<string, string> = {
  tunnel_up: 'Connected',
  tunnel_down: 'Disconnected',
  reconnect: 'Reconnecting',
  connect_failed: 'Connect failed',
  unavailable: 'Internet unavailable',
  available: 'Internet restored',
}

const UP_EVENTS = new Set(['tunnel_up', 'available'])

export function buildEventMarkers(events: PublicTunnelConnectionEvent[]): ChartEventMarker[] {
  return events
    .map((event) => ({
      x: toSeconds(event.occurred_at),
      eventType: event.event_type,
      up: UP_EVENTS.has(event.event_type),
      label: EVENT_LABELS[event.event_type] ?? event.event_type.replace(/_/g, ' '),
      message: event.message ?? null,
    }))
    .sort((a, b) => a.x - b.x)
}
