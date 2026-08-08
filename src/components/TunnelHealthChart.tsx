import type { PublicTunnelConnectionEvent, PublicTunnelMetricPoint } from '../api/tunnelMetrics'

const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 16, right: 48, bottom: 36, left: 48 }

type Props = {
  points: PublicTunnelMetricPoint[]
  events: PublicTunnelConnectionEvent[]
  rangeStart: string
  rangeEnd: string
}

function toMs(value: string): number {
  return new Date(value).getTime()
}

function formatTick(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function buildSegmentedPath(
  points: PublicTunnelMetricPoint[],
  options: {
    valueOf: (point: PublicTunnelMetricPoint) => number | null | undefined
    xFor: (iso: string) => number
    yFor: (value: number) => number
  },
): string {
  const parts: string[] = []
  let drawing = false

  for (const point of points) {
    const raw = options.valueOf(point)
    const hasValue = raw != null && Number.isFinite(raw)
    const isOutage = point.outcome !== 'up' && point.outcome !== 'degraded'

    if (!hasValue || isOutage) {
      drawing = false
      continue
    }

    const x = options.xFor(point.checked_at)
    const y = options.yFor(Number(raw))
    parts.push(`${drawing ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    drawing = true
  }

  return parts.join(' ')
}

export function TunnelHealthChart({ points, events, rangeStart, rangeEnd }: Props) {
  const start = toMs(rangeStart)
  const end = Math.max(toMs(rangeEnd), start + 1)
  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const pingValues = points
    .map((point) => point.gateway_ping_avg_ms)
    .filter((value): value is number => value != null && Number.isFinite(value))
  const maxPing = pingValues.length > 0 ? Math.max(...pingValues, 1) * 1.15 : 100

  const xFor = (iso: string) => PAD.left + ((toMs(iso) - start) / (end - start)) * innerW
  const yForPing = (ms: number) => PAD.top + innerH - (ms / maxPing) * innerH
  const yForLoss = (pct: number) => PAD.top + innerH - (Math.min(Math.max(pct, 0), 100) / 100) * innerH

  const pingPath = buildSegmentedPath(points, {
    valueOf: (point) => point.gateway_ping_avg_ms,
    xFor,
    yFor: yForPing,
  })
  const lossPath = buildSegmentedPath(points, {
    valueOf: (point) => point.gateway_ping_loss_percent,
    xFor,
    yFor: yForLoss,
  })

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => start + (end - start) * fraction)

  if (points.length === 0 && events.length === 0) {
    return (
      <div className="tunnel-chart tunnel-chart--empty" role="img" aria-label="No tunnel samples yet">
        <p className="muted">No probe samples in this window yet.</p>
      </div>
    )
  }

  return (
    <svg
      className="tunnel-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Gateway ping and packet loss over the last two hours"
    >
      <rect
        x={PAD.left}
        y={PAD.top}
        width={innerW}
        height={innerH}
        className="tunnel-chart__plot"
      />

      {points.map((point, index) => {
        if (point.outcome === 'up' || point.outcome === 'degraded') return null
        const x = xFor(point.checked_at)
        return (
          <line
            key={`out-${point.checked_at}-${index}`}
            x1={x}
            x2={x}
            y1={PAD.top}
            y2={PAD.top + innerH}
            className="tunnel-chart__outage"
          />
        )
      })}

      {[0, 0.5, 1].map((fraction) => {
        const y = PAD.top + innerH * (1 - fraction)
        return (
          <g key={`grid-${fraction}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={y}
              y2={y}
              className="tunnel-chart__grid"
            />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="tunnel-chart__label">
              {Math.round(maxPing * fraction)}
            </text>
          </g>
        )
      })}

      {pingPath && <path d={pingPath} className="tunnel-chart__ping" fill="none" />}
      {lossPath && <path d={lossPath} className="tunnel-chart__loss" fill="none" />}

      {events.map((event, index) => {
        const x = xFor(event.occurred_at)
        const key = event.id ?? `${event.event_type}-${event.occurred_at}-${index}`
        return (
          <g key={key}>
            <line
              x1={x}
              x2={x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className={`tunnel-chart__event tunnel-chart__event--${event.event_type}`}
            />
            <circle
              cx={x}
              cy={PAD.top + 6}
              r={3.5}
              className={`tunnel-chart__event-dot tunnel-chart__event--${event.event_type}`}
            />
          </g>
        )
      })}

      {ticks.map((tick) => (
        <text
          key={tick}
          x={PAD.left + ((tick - start) / (end - start)) * innerW}
          y={HEIGHT - 10}
          textAnchor="middle"
          className="tunnel-chart__label"
        >
          {formatTick(tick)}
        </text>
      ))}

      <text x={PAD.left + innerW + 8} y={PAD.top + 12} className="tunnel-chart__axis-note">
        ms
      </text>
      <text x={PAD.left + innerW + 8} y={PAD.top + innerH} className="tunnel-chart__axis-note">
        loss%
      </text>
    </svg>
  )
}
