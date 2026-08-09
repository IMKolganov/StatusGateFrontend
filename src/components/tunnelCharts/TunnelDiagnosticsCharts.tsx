import { useCallback, useId, useMemo } from 'react'
import type uPlot from 'uplot'
import type {
  PublicTunnelConnectionEvent,
  PublicTunnelMetricPoint,
  PublicTunnelPingSample,
} from '../../api/tunnelMetrics'
import { buildContinuousPingData, buildEventMarkers, buildTunnelChartData } from './tunnelChartData'
import {
  INTERNET_COLOR,
  INTERNET_LOSS_COLOR,
  INTERNET_MAX_COLOR,
  JITTER_COLOR,
  LOSS_COLOR,
  PING_COLOR,
  PING_MAX_COLOR,
  baseAxes,
  baseOptions,
  fmt,
  lossFill,
  makeThroughputChartOptions,
} from './tunnelChartOptions'
import { UplotPanel, type PanelLiveState } from './UplotPanel'
import type { TooltipRow } from './tunnelChartPlugins'
import { INTERNET_PING_HOST } from '../../utils/speedTestConfig'

type Props = {
  points: PublicTunnelMetricPoint[]
  pingSamples?: PublicTunnelPingSample[]
  events: PublicTunnelConnectionEvent[]
  rangeStart: string
  rangeEnd: string
}

function toSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

export function TunnelDiagnosticsCharts({ points, pingSamples, events, rangeStart, rangeEnd }: Props) {
  const syncKey = useId()

  const chartData = useMemo(() => buildTunnelChartData(points), [points])
  const continuous = useMemo(() => buildContinuousPingData(pingSamples ?? []), [pingSamples])
  const eventMarkers = useMemo(() => buildEventMarkers(events), [events])
  const overlays = useMemo(
    () => ({ outages: chartData.outages, events: eventMarkers }),
    [chartData, eventMarkers],
  )
  const range = useMemo(
    () => ({ start: toSeconds(rangeStart), end: toSeconds(rangeEnd) }),
    [rangeStart, rangeEnd],
  )
  const useContinuous = continuous.sampleCount > 0

  const pingData = useMemo(() => chartData.ping as uPlot.AlignedData, [chartData])
  const lossData = useMemo(() => chartData.loss as uPlot.AlignedData, [chartData])
  const continuousPingData = useMemo(() => continuous.ping as uPlot.AlignedData, [continuous])
  const continuousLossData = useMemo(() => continuous.loss as uPlot.AlignedData, [continuous])
  const throughputData = useMemo(() => chartData.throughput as uPlot.AlignedData, [chartData])
  const uploadThroughputData = useMemo(
    () => chartData.uploadThroughput as uPlot.AlignedData,
    [chartData],
  )

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

  const makeContinuousPingOptions = useCallback(
    (getState: () => PanelLiveState): Omit<uPlot.Options, 'width' | 'height'> => {
      const base = baseOptions(syncKey, getState, (u, idx) => {
        const rows: TooltipRow[] = []
        const gwAvg = u.data[1]?.[idx]
        const inetAvg = u.data[2]?.[idx]
        const gwMax = u.data[3]?.[idx]
        const inetMax = u.data[4]?.[idx]
        if (gwAvg != null) rows.push({ label: 'Gateway avg', value: fmt(gwAvg, 1, 'ms') })
        if (gwMax != null) rows.push({ label: 'Gateway worst', value: fmt(gwMax, 1, 'ms') })
        if (inetAvg != null) rows.push({ label: 'Internet avg', value: fmt(inetAvg, 1, 'ms') })
        if (inetMax != null) rows.push({ label: 'Internet worst', value: fmt(inetMax, 1, 'ms') })
        if (rows.length === 0) rows.push({ label: 'Ping', value: 'no samples this minute' })
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
            label: 'Gateway avg (ms)',
            stroke: PING_COLOR,
            width: 2,
            points: { show: false },
          },
          {
            label: `Internet ${INTERNET_PING_HOST} avg (ms)`,
            stroke: INTERNET_COLOR,
            width: 2,
            points: { show: false },
          },
          {
            label: 'Gateway worst (ms)',
            stroke: PING_MAX_COLOR,
            width: 1,
            points: { show: false },
          },
          {
            label: 'Internet worst (ms)',
            stroke: INTERNET_MAX_COLOR,
            width: 1,
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
            fill: lossFill(
              'rgba(217, 119, 6, 0.06)',
              'rgba(217, 119, 6, 0.3)',
              'rgba(220, 38, 38, 0.55)',
            ),
          },
        ],
      }
    },
    [syncKey],
  )

  const makeContinuousLossOptions = useCallback(
    (getState: () => PanelLiveState): Omit<uPlot.Options, 'width' | 'height'> => {
      const base = baseOptions(syncKey, getState, (u, idx) => {
        const rows: TooltipRow[] = []
        const gwLoss = u.data[1]?.[idx]
        const inetLoss = u.data[2]?.[idx]
        if (gwLoss != null) rows.push({ label: 'Gateway loss', value: fmt(gwLoss, 1, '%') })
        if (inetLoss != null) rows.push({ label: 'Internet loss', value: fmt(inetLoss, 1, '%') })
        if (rows.length === 0) rows.push({ label: 'Loss', value: 'no samples this minute' })
        return rows
      })
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
            label: 'Gateway loss (%)',
            stroke: LOSS_COLOR,
            width: 1.5,
            dash: [5, 4],
            points: { show: false },
          },
          {
            label: 'Internet loss (%)',
            stroke: INTERNET_LOSS_COLOR,
            width: 1.5,
            points: { show: false },
            fill: lossFill(
              'rgba(220, 38, 38, 0.05)',
              'rgba(220, 38, 38, 0.25)',
              'rgba(220, 38, 38, 0.55)',
            ),
          },
        ],
      }
    },
    [syncKey],
  )

  const makeThroughputOptions = useCallback(
    (getState: () => PanelLiveState) => makeThroughputChartOptions(syncKey, getState, 'download'),
    [syncKey],
  )

  const makeUploadThroughputOptions = useCallback(
    (getState: () => PanelLiveState) => makeThroughputChartOptions(syncKey, getState, 'upload'),
    [syncKey],
  )

  if (points.length === 0 && !useContinuous) {
    return (
      <div className="tunnel-charts-empty">
        <p className="muted">No data in this window — the tunnel has not been probed yet.</p>
      </div>
    )
  }

  return (
    <div className="tunnel-charts">
      <div className="tunnel-charts__panel">
        <h3>{useContinuous ? 'In-tunnel ping (continuous)' : 'Gateway ping'}</h3>
        <p className="muted tunnel-charts__hint">
          {useContinuous ? (
            <>
              One ping per second, aggregated per minute. Solid lines are averages, faint lines are
              the worst packet each minute — short stalls show up as spikes. Gateway is the first
              VPN hop; Internet ({INTERNET_PING_HOST}) goes through the exit, the same path your traffic takes.
            </>
          ) : (
            <>
              Light health probe each check cycle. Red bands are failed checks; dashed verticals
              are connection events.
            </>
          )}
        </p>
        {useContinuous ? (
          <UplotPanel
            makeOptions={makeContinuousPingOptions}
            data={continuousPingData}
            overlays={overlays}
            range={range}
            height={230}
            ariaLabel="Continuous in-tunnel ping latency in milliseconds over time"
          />
        ) : chartData.hasPing ? (
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
          {useContinuous ? (
            <>
              Per-minute loss from the continuous pinger. The filled red series is loss on the
              internet path through the exit — the one that makes video stall; the dashed amber
              line is loss to the gateway.
            </>
          ) : (
            <>Loss from the gateway ping. The fill gets hotter as loss escalates.</>
          )}
        </p>
        {useContinuous ? (
          <UplotPanel
            makeOptions={makeContinuousLossOptions}
            data={continuousLossData}
            overlays={overlays}
            range={range}
            height={170}
            ariaLabel="Continuous packet loss percentage over time"
          />
        ) : chartData.hasLoss ? (
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
        <h3>Download throughput</h3>
        <p className="muted tunnel-charts__hint">
          Full download tests through the VPN versus the host WAN (without VPN). Tests share a
          rate limit — filled markers are fresh, hollow are cached VPN results; blue is host WAN.
        </p>
        {chartData.speedSampleCount > 0 ? (
          <>
            {chartData.freshSpeedCount === 0 && (
              <p className="muted tunnel-charts__note">
                No fresh VPN download ran in this window — only cached or WAN values are shown.
              </p>
            )}
            <UplotPanel
              makeOptions={makeThroughputOptions}
              data={throughputData}
              overlays={overlays}
              range={range}
              height={210}
              ariaLabel="Download throughput through VPN and host WAN in megabits per second"
            />
          </>
        ) : (
          <p className="muted tunnel-charts__note">
            Download throughput was not measured in this window. Full tests run on a shared
            schedule, not on every probe — this is not missing data.
          </p>
        )}
      </div>

      <div className="tunnel-charts__panel">
        <h3>Upload throughput</h3>
        <p className="muted tunnel-charts__hint">
          Upload capacity through the VPN versus the host without VPN. Same shared schedule as
          downloads — useful for spotting asymmetric tunnels (slow upload with strong download).
        </p>
        {chartData.uploadSampleCount > 0 ? (
          <>
            {chartData.freshUploadCount === 0 && (
              <p className="muted tunnel-charts__note">
                No fresh VPN upload ran in this window — only cached or WAN values are shown.
              </p>
            )}
            <UplotPanel
              makeOptions={makeUploadThroughputOptions}
              data={uploadThroughputData}
              overlays={overlays}
              range={range}
              height={210}
              ariaLabel="Upload throughput through VPN and host WAN in megabits per second"
            />
          </>
        ) : (
          <p className="muted tunnel-charts__note">
            Upload throughput was not measured in this window yet. Cloudflare __up runs with the
            download test when the template supports it.
          </p>
        )}
      </div>
    </div>
  )
}
