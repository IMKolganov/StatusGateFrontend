import { useCallback, useId, useMemo } from 'react'
import type uPlot from 'uplot'
import type { PublicTunnelConnectionEvent, PublicTunnelMetricPoint } from '../../api/tunnelMetrics'
import { buildEventMarkers, buildTunnelChartData } from './tunnelChartData'
import {
  overlaysPlugin,
  tooltipPlugin,
  type TooltipRow,
} from './tunnelChartPlugins'
import { UplotPanel, type PanelLiveState } from './UplotPanel'

const PING_COLOR = '#2563eb'
const JITTER_COLOR = '#7c3aed'
const LOSS_COLOR = '#d97706'
const THROUGHPUT_COLOR = '#059669'
const AXIS_STROKE = '#6b7280'
const GRID_STROKE = 'rgba(148, 163, 184, 0.3)'

type Props = {
  points: PublicTunnelMetricPoint[]
  events: PublicTunnelConnectionEvent[]
  rangeStart: string
  rangeEnd: string
}

function toSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

function fmt(value: number | null | undefined, digits: number, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Number(value).toFixed(digits)} ${unit}`
}

function baseAxes(unitLabel: string): uPlot.Axis[] {
  return [
    {
      stroke: AXIS_STROKE,
      grid: { stroke: GRID_STROKE, width: 1 },
      ticks: { stroke: GRID_STROKE, width: 1 },
    },
    {
      stroke: AXIS_STROKE,
      grid: { stroke: GRID_STROKE, width: 1 },
      ticks: { stroke: GRID_STROKE, width: 1 },
      size: 56,
      label: unitLabel,
      labelSize: 14,
    },
  ]
}

function baseOptions(
  syncKey: string,
  getState: () => PanelLiveState,
  formatRows: (u: uPlot, idx: number) => TooltipRow[],
): Pick<uPlot.Options, 'cursor' | 'legend' | 'plugins' | 'scales'> {
  const getOverlays = () => getState().overlays
  return {
    cursor: {
      sync: { key: syncKey, setSeries: false },
      points: { size: 7 },
    },
    legend: { live: false },
    plugins: [overlaysPlugin(getOverlays), tooltipPlugin(formatRows, getOverlays)],
    scales: {
      x: {
        time: true,
        range: () => [getState().range.start, getState().range.end],
      },
    },
  }
}

export function TunnelDiagnosticsCharts({ points, events, rangeStart, rangeEnd }: Props) {
  const syncKey = useId()

  const chartData = useMemo(() => buildTunnelChartData(points), [points])
  const eventMarkers = useMemo(() => buildEventMarkers(events), [events])
  const overlays = useMemo(
    () => ({ outages: chartData.outages, events: eventMarkers }),
    [chartData, eventMarkers],
  )
  const range = useMemo(
    () => ({ start: toSeconds(rangeStart), end: toSeconds(rangeEnd) }),
    [rangeStart, rangeEnd],
  )

  const pingData = useMemo(() => chartData.ping as uPlot.AlignedData, [chartData])
  const lossData = useMemo(() => chartData.loss as uPlot.AlignedData, [chartData])
  const throughputData = useMemo(() => chartData.throughput as uPlot.AlignedData, [chartData])

  const makePingOptions = useCallback(
    (getState: () => PanelLiveState): Omit<uPlot.Options, 'width' | 'height'> => {
      const base = baseOptions(syncKey, getState, (u, idx) => {
        const rows: TooltipRow[] = [
          { label: 'Gateway ping', value: fmt(u.data[1]?.[idx], 1, 'ms') },
        ]
        const jitter = u.data[2]?.[idx]
        if (jitter != null) rows.push({ label: 'Jitter', value: fmt(jitter, 1, 'ms') })
        return rows
      })
      return {
        ...base,
        scales: {
          ...base.scales,
          y: {
            range: (_u, _min, max) => [0, Math.max(max * 1.15, 10)],
          },
        },
        axes: baseAxes('ms'),
        series: [
          {},
          {
            label: 'Gateway ping (ms)',
            stroke: PING_COLOR,
            width: 2,
            points: { show: false },
          },
          {
            label: 'Jitter (ms)',
            stroke: JITTER_COLOR,
            width: 1,
            dash: [4, 4],
            points: { show: false },
          },
        ],
      }
    },
    [syncKey],
  )

  const makeLossOptions = useCallback(
    (getState: () => PanelLiveState): Omit<uPlot.Options, 'width' | 'height'> => {
      const base = baseOptions(syncKey, getState, (u, idx) => [
        { label: 'Packet loss', value: fmt(u.data[1]?.[idx], 0, '%') },
      ])
      return {
        ...base,
        scales: {
          ...base.scales,
          y: { range: () => [0, 100] },
        },
        axes: baseAxes('%'),
        series: [
          {},
          {
            label: 'Packet loss (%)',
            stroke: LOSS_COLOR,
            width: 1.5,
            points: { show: false },
            // SmokePing-style escalation: fill gets hotter as loss climbs toward 100%.
            fill: (u) => {
              const gradient = u.ctx.createLinearGradient(
                0,
                u.bbox.top + u.bbox.height,
                0,
                u.bbox.top,
              )
              gradient.addColorStop(0, 'rgba(217, 119, 6, 0.06)')
              gradient.addColorStop(0.4, 'rgba(217, 119, 6, 0.3)')
              gradient.addColorStop(1, 'rgba(220, 38, 38, 0.55)')
              return gradient
            },
          },
        ],
      }
    },
    [syncKey],
  )

  const makeThroughputOptions = useCallback(
    (getState: () => PanelLiveState): Omit<uPlot.Options, 'width' | 'height'> => {
      const base = baseOptions(syncKey, getState, (u, idx) => {
        const rows: TooltipRow[] = []
        const fresh = u.data[1]?.[idx]
        const cached = u.data[2]?.[idx]
        if (fresh != null) rows.push({ label: 'Download (fresh test)', value: fmt(fresh, 1, 'Mbps') })
        if (cached != null) rows.push({ label: 'Download (cached)', value: fmt(cached, 1, 'Mbps') })
        if (fresh == null && cached == null) {
          rows.push({ label: 'Download', value: 'no test at this sample' })
        }
        return rows
      })
      return {
        ...base,
        scales: {
          ...base.scales,
          y: {
            range: (_u, _min, max) => [0, Math.max(max * 1.2, 10)],
          },
        },
        axes: baseAxes('Mbps'),
        series: [
          {},
          {
            label: 'Fresh download test (Mbps)',
            stroke: THROUGHPUT_COLOR,
            // Speed tests are sparse: markers only, no line interpolation between them.
            paths: () => null,
            points: { show: true, size: 9, width: 2, stroke: THROUGHPUT_COLOR, fill: THROUGHPUT_COLOR },
          },
          {
            label: 'Cached / deferred (Mbps)',
            stroke: THROUGHPUT_COLOR,
            paths: () => null,
            points: { show: true, size: 8, width: 2, stroke: THROUGHPUT_COLOR, fill: '#ffffff' },
          },
        ],
      }
    },
    [syncKey],
  )

  if (points.length === 0) {
    return (
      <div className="tunnel-charts-empty">
        <p className="muted">No data in this window — the tunnel has not been probed yet.</p>
      </div>
    )
  }

  return (
    <div className="tunnel-charts">
      <div className="tunnel-charts__panel">
        <h3>Gateway ping</h3>
        <p className="muted tunnel-charts__hint">
          Light health probe each check cycle. Red bands are failed checks; dashed verticals are
          connection events.
        </p>
        {chartData.hasPing ? (
          <UplotPanel
            makeOptions={makePingOptions}
            data={pingData}
            overlays={overlays}
            range={range}
            height={230}
            ariaLabel="Gateway ping and jitter in milliseconds over time"
          />
        ) : (
          <p className="muted tunnel-charts__note">No gateway ping samples in this window.</p>
        )}
      </div>

      <div className="tunnel-charts__panel">
        <h3>Packet loss</h3>
        <p className="muted tunnel-charts__hint">
          Loss from the gateway ping. The fill gets hotter as loss escalates.
        </p>
        {chartData.hasLoss ? (
          <UplotPanel
            makeOptions={makeLossOptions}
            data={lossData}
            overlays={overlays}
            range={range}
            height={170}
            ariaLabel="Packet loss percentage over time"
          />
        ) : (
          <p className="muted tunnel-charts__note">No packet loss samples in this window.</p>
        )}
      </div>

      <div className="tunnel-charts__panel">
        <h3>Throughput</h3>
        <p className="muted tunnel-charts__hint">
          Full download speed tests through the VPN. Tests share a rate limit across services, so
          markers are sparse — filled is a fresh test, hollow reuses a cached result.
        </p>
        {chartData.speedSampleCount > 0 ? (
          <>
            {chartData.freshSpeedCount === 0 && (
              <p className="muted tunnel-charts__note">
                No fresh speed test ran in this window — only cached values are shown while the
                service waits for a free test slot.
              </p>
            )}
            <UplotPanel
              makeOptions={makeThroughputOptions}
              data={throughputData}
              overlays={overlays}
              range={range}
              height={210}
              ariaLabel="Tunnel download throughput in megabits per second"
            />
          </>
        ) : (
          <p className="muted tunnel-charts__note">
            Throughput was not measured in this window. Full download tests run on a shared
            schedule, not on every probe — this is not missing data.
          </p>
        )}
      </div>
    </div>
  )
}
