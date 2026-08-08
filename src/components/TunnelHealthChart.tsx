import { useId, useState } from 'react'
import type { PublicTunnelConnectionEvent, PublicTunnelMetricPoint } from '../api/tunnelMetrics'

const WIDTH = 760
const HEIGHT = 280
const PAD = { top: 28, right: 56, bottom: 44, left: 56 }

type Props = {
  points: PublicTunnelMetricPoint[]
  events: PublicTunnelConnectionEvent[]
  rangeStart: string
  rangeEnd: string
}

type HoverInfo = {
  x: number
  y: number
  lines: string[]
}

function toMs(value: string): number {
  return new Date(value).getTime()
}

function formatTick(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
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
  const clipId = useId().replace(/:/g, '')
  const [hover, setHover] = useState<HoverInfo | null>(null)
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

  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => start + (end - start) * fraction)
  const pingTicks = [0, 0.5, 1]
  const lossTicks = [0, 50, 100]

  if (points.length === 0 && events.length === 0) {
    return (
      <div className="tunnel-chart tunnel-chart--empty" role="img" aria-label="No tunnel samples yet">
        <p className="muted">No probe samples in this window yet.</p>
      </div>
    )
  }

  return (
    <div className="tunnel-chart-wrap">
      <svg
        className="tunnel-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Gateway ping in milliseconds and packet loss percent over the last two hours"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={`plot-${clipId}`}>
            <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          className="tunnel-chart__plot"
        />

        <text
          x={16}
          y={PAD.top + innerH / 2}
          className="tunnel-chart__axis-title"
          transform={`rotate(-90 16 ${PAD.top + innerH / 2})`}
          textAnchor="middle"
        >
          Gateway ping (ms)
        </text>
        <text
          x={WIDTH - 14}
          y={PAD.top + innerH / 2}
          className="tunnel-chart__axis-title tunnel-chart__axis-title--loss"
          transform={`rotate(90 ${WIDTH - 14} ${PAD.top + innerH / 2})`}
          textAnchor="middle"
        >
          Packet loss (%)
        </text>

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

        {pingTicks.map((fraction) => {
          const y = PAD.top + innerH * (1 - fraction)
          return (
            <g key={`ping-grid-${fraction}`}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y}
                y2={y}
                className="tunnel-chart__grid"
              />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="tunnel-chart__label">
                {Math.round(maxPing * fraction)}
              </text>
            </g>
          )
        })}

        {lossTicks.map((pct) => {
          const y = yForLoss(pct)
          return (
            <text
              key={`loss-tick-${pct}`}
              x={PAD.left + innerW + 10}
              y={y + 4}
              textAnchor="start"
              className="tunnel-chart__label tunnel-chart__label--loss"
            >
              {pct}%
            </text>
          )
        })}

        <g clipPath={`url(#plot-${clipId})`}>
          {pingPath && <path d={pingPath} className="tunnel-chart__ping" fill="none" />}
          {lossPath && <path d={lossPath} className="tunnel-chart__loss" fill="none" />}

          {points.map((point, index) => {
            if (point.gateway_ping_avg_ms == null) return null
            if (point.outcome !== 'up' && point.outcome !== 'degraded') return null
            const x = xFor(point.checked_at)
            const y = yForPing(Number(point.gateway_ping_avg_ms))
            return (
              <circle
                key={`ping-dot-${point.checked_at}-${index}`}
                cx={x}
                cy={y}
                r={3}
                className="tunnel-chart__ping-dot"
                onMouseEnter={() => {
                  const lines = [
                    formatClock(point.checked_at),
                    `Status: ${point.outcome}`,
                    `Gateway ping: ${Number(point.gateway_ping_avg_ms).toFixed(1)} ms`,
                  ]
                  if (point.gateway_ping_jitter_ms != null) {
                    lines.push(`Jitter: ${Number(point.gateway_ping_jitter_ms).toFixed(1)} ms`)
                  }
                  if (point.gateway_ping_loss_percent != null) {
                    lines.push(`Packet loss: ${Number(point.gateway_ping_loss_percent).toFixed(0)}%`)
                  }
                  setHover({ x, y, lines })
                }}
              />
            )
          })}
        </g>

        {events.map((event, index) => {
          const x = xFor(event.occurred_at)
          const key = event.id ?? `${event.event_type}-${event.occurred_at}-${index}`
          const up = event.event_type === 'tunnel_up' || event.event_type === 'available'
          return (
            <g
              key={key}
              onMouseEnter={() => {
                setHover({
                  x,
                  y: PAD.top + 18,
                  lines: [
                    formatClock(event.occurred_at),
                    `Event: ${event.event_type.replace(/_/g, ' ')}`,
                    ...(event.message ? [event.message] : []),
                  ],
                })
              }}
            >
              <line
                x1={x}
                x2={x}
                y1={PAD.top}
                y2={PAD.top + innerH}
                className={`tunnel-chart__event tunnel-chart__event--${event.event_type}`}
              />
              <circle
                cx={x}
                cy={PAD.top + 8}
                r={4}
                className={`tunnel-chart__event-dot ${up ? 'tunnel-chart__event--tunnel_up' : 'tunnel-chart__event--tunnel_down'}`}
              />
            </g>
          )
        })}

        {timeTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left + ((tick - start) / (end - start)) * innerW}
            y={HEIGHT - 14}
            textAnchor="middle"
            className="tunnel-chart__label"
          >
            {formatTick(tick)}
          </text>
        ))}

        {hover && (
          <g className="tunnel-chart__tooltip" pointerEvents="none">
            <rect
              x={Math.min(Math.max(hover.x - 70, PAD.left), PAD.left + innerW - 140)}
              y={Math.max(hover.y - 18 - hover.lines.length * 14, PAD.top)}
              width={140}
              height={12 + hover.lines.length * 14}
              rx={6}
              className="tunnel-chart__tooltip-bg"
            />
            {hover.lines.map((line, index) => (
              <text
                key={line}
                x={Math.min(Math.max(hover.x - 70, PAD.left), PAD.left + innerW - 140) + 8}
                y={Math.max(hover.y - 18 - hover.lines.length * 14, PAD.top) + 16 + index * 14}
                className="tunnel-chart__tooltip-text"
              >
                {line}
              </text>
            ))}
          </g>
        )}
      </svg>
    </div>
  )
}
