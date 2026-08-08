import { useId, useState } from 'react'
import type { PublicTunnelMetricPoint } from '../api/tunnelMetrics'

const WIDTH = 760
const HEIGHT = 240
const PAD = { top: 28, right: 24, bottom: 44, left: 56 }

type Props = {
  points: PublicTunnelMetricPoint[]
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

function buildLivePath(
  points: PublicTunnelMetricPoint[],
  options: {
    xFor: (iso: string) => number
    yFor: (value: number) => number
  },
): string {
  const parts: string[] = []
  let drawing = false

  for (const point of points) {
    const raw = point.download_mbps
    const isLive =
      raw != null &&
      Number.isFinite(raw) &&
      raw > 0 &&
      point.download_cached !== true &&
      (point.outcome === 'up' || point.outcome === 'degraded')

    if (!isLive) {
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

export function TunnelThroughputChart({ points, rangeStart, rangeEnd }: Props) {
  const clipId = useId().replace(/:/g, '')
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const start = toMs(rangeStart)
  const end = Math.max(toMs(rangeEnd), start + 1)
  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const speedPoints = points.filter(
    (point) =>
      point.download_mbps != null &&
      Number.isFinite(point.download_mbps) &&
      Number(point.download_mbps) > 0 &&
      (point.outcome === 'up' || point.outcome === 'degraded'),
  )
  const liveValues = speedPoints
    .filter((point) => point.download_cached !== true)
    .map((point) => Number(point.download_mbps))
  const maxMbps =
    liveValues.length > 0
      ? Math.max(...liveValues, 1) * 1.15
      : speedPoints.length > 0
        ? Math.max(...speedPoints.map((point) => Number(point.download_mbps)), 1) * 1.15
        : 100

  const xFor = (iso: string) => PAD.left + ((toMs(iso) - start) / (end - start)) * innerW
  const yForMbps = (mbps: number) => PAD.top + innerH - (mbps / maxMbps) * innerH
  const livePath = buildLivePath(points, { xFor, yFor: yForMbps })
  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => start + (end - start) * fraction)
  const mbpsTicks = [0, 0.5, 1]

  if (speedPoints.length === 0) {
    return (
      <div
        className="tunnel-chart tunnel-chart--empty"
        role="img"
        aria-label="No throughput samples yet"
      >
        <p className="muted">
          No full download speed tests in this window yet. Throughput runs on a shared schedule, not
          on every probe.
        </p>
      </div>
    )
  }

  return (
    <div className="tunnel-chart-wrap">
      <svg
        className="tunnel-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Tunnel download throughput in megabits per second over the last two hours"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id={`plot-tp-${clipId}`}>
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
          className="tunnel-chart__axis-title tunnel-chart__axis-title--throughput"
          transform={`rotate(-90 16 ${PAD.top + innerH / 2})`}
          textAnchor="middle"
        >
          Download (Mbps)
        </text>

        {points.map((point, index) => {
          if (point.outcome === 'up' || point.outcome === 'degraded') return null
          const x = xFor(point.checked_at)
          return (
            <line
              key={`out-tp-${point.checked_at}-${index}`}
              x1={x}
              x2={x}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="tunnel-chart__outage"
            />
          )
        })}

        {mbpsTicks.map((fraction) => {
          const y = PAD.top + innerH * (1 - fraction)
          return (
            <g key={`mbps-grid-${fraction}`}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y}
                y2={y}
                className="tunnel-chart__grid"
              />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="tunnel-chart__label">
                {Math.round(maxMbps * fraction)}
              </text>
            </g>
          )
        })}

        <g clipPath={`url(#plot-tp-${clipId})`}>
          {livePath && <path d={livePath} className="tunnel-chart__throughput" fill="none" />}

          {speedPoints.map((point, index) => {
            const mbps = Number(point.download_mbps)
            const x = xFor(point.checked_at)
            const y = yForMbps(mbps)
            const cached = point.download_cached === true
            return (
              <g key={`speed-${point.checked_at}-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.top + innerH}
                  y2={y}
                  className={
                    cached
                      ? 'tunnel-chart__throughput-stem tunnel-chart__throughput-stem--cached'
                      : 'tunnel-chart__throughput-stem'
                  }
                />
                <circle
                  cx={x}
                  cy={y}
                  r={cached ? 3.5 : 4.5}
                  className={
                    cached
                      ? 'tunnel-chart__throughput-dot tunnel-chart__throughput-dot--cached'
                      : 'tunnel-chart__throughput-dot'
                  }
                  onMouseEnter={() => {
                    const lines = [
                      formatClock(point.checked_at),
                      `Download: ${mbps.toFixed(2)} Mbps`,
                      cached
                        ? 'Cached / deferred (not a fresh full test)'
                        : 'Fresh full tunnel download test',
                    ]
                    if (point.download_bytes != null && point.download_bytes > 0) {
                      lines.push(`Payload: ${(point.download_bytes / (1024 * 1024)).toFixed(1)} MB`)
                    }
                    if (point.download_duration_ms != null) {
                      lines.push(`Duration: ${Number(point.download_duration_ms).toFixed(0)} ms`)
                    }
                    setHover({
                      x,
                      y,
                      lines,
                    })
                  }}
                />
              </g>
            )
          })}
        </g>

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
              x={Math.min(Math.max(hover.x - 90, PAD.left), PAD.left + innerW - 180)}
              y={Math.max(hover.y - 18 - hover.lines.length * 14, PAD.top)}
              width={180}
              height={12 + hover.lines.length * 14}
              rx={6}
              className="tunnel-chart__tooltip-bg"
            />
            {hover.lines.map((line, lineIndex) => (
              <text
                key={`${line}-${lineIndex}`}
                x={Math.min(Math.max(hover.x - 90, PAD.left), PAD.left + innerW - 180) + 8}
                y={Math.max(hover.y - 18 - hover.lines.length * 14, PAD.top) + 16 + lineIndex * 14}
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
