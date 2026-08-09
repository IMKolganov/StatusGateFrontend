import type uPlot from 'uplot'
import {
  overlaysPlugin,
  tooltipPlugin,
  type TooltipRow,
} from './tunnelChartPlugins'
import type { PanelLiveState } from './UplotPanel'

export const PING_COLOR = '#2563eb'
export const INTERNET_COLOR = '#0d9488'
export const PING_MAX_COLOR = 'rgba(37, 99, 235, 0.35)'
export const INTERNET_MAX_COLOR = 'rgba(13, 148, 136, 0.35)'
export const JITTER_COLOR = '#7c3aed'
export const LOSS_COLOR = '#d97706'
export const INTERNET_LOSS_COLOR = '#dc2626'
export const THROUGHPUT_COLOR = '#059669'
export const WAN_THROUGHPUT_COLOR = '#0284c7'
export const UPLOAD_COLOR = '#c2410c'
export const WAN_UPLOAD_COLOR = '#7c3aed'
export const AXIS_STROKE = '#6b7280'
export const GRID_STROKE = 'rgba(148, 163, 184, 0.3)'

export function fmt(value: number | null | undefined, digits: number, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Number(value).toFixed(digits)} ${unit}`
}

export function baseAxes(unitLabel: string): uPlot.Axis[] {
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

/** SmokePing-style escalation: fill gets hotter as loss climbs toward 100%. */
export function lossFill(base: string, mid: string, hot: string): uPlot.Series.Fill {
  return (u) => {
    const { top, height } = u.bbox
    if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) {
      return mid
    }
    const gradient = u.ctx.createLinearGradient(0, top + height, 0, top)
    gradient.addColorStop(0, base)
    gradient.addColorStop(0.4, mid)
    gradient.addColorStop(1, hot)
    return gradient
  }
}

export function baseOptions(
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

type ThroughputKind = 'download' | 'upload'

const THROUGHPUT_THEME: Record<
  ThroughputKind,
  { vpn: string; wan: string; freshLabel: string; cachedLabel: string; wanLabel: string; emptyLabel: string }
> = {
  download: {
    vpn: THROUGHPUT_COLOR,
    wan: WAN_THROUGHPUT_COLOR,
    freshLabel: 'VPN download (fresh)',
    cachedLabel: 'VPN download (cached)',
    wanLabel: 'WAN download (host)',
    emptyLabel: 'Download',
  },
  upload: {
    vpn: UPLOAD_COLOR,
    wan: WAN_UPLOAD_COLOR,
    freshLabel: 'VPN upload (fresh)',
    cachedLabel: 'VPN upload (cached)',
    wanLabel: 'WAN upload (host)',
    emptyLabel: 'Upload',
  },
}

export function makeThroughputChartOptions(
  syncKey: string,
  getState: () => PanelLiveState,
  kind: ThroughputKind,
): Omit<uPlot.Options, 'width' | 'height'> {
  const theme = THROUGHPUT_THEME[kind]
  const base = baseOptions(syncKey, getState, (u, idx) => {
    const rows: TooltipRow[] = []
    const fresh = u.data[1]?.[idx]
    const cached = u.data[2]?.[idx]
    const wan = u.data[3]?.[idx]
    if (fresh != null) rows.push({ label: theme.freshLabel, value: fmt(fresh, 1, 'Mbps') })
    if (cached != null) rows.push({ label: theme.cachedLabel, value: fmt(cached, 1, 'Mbps') })
    if (wan != null) rows.push({ label: theme.wanLabel, value: fmt(wan, 1, 'Mbps') })
    if (fresh == null && cached == null && wan == null) {
      rows.push({ label: theme.emptyLabel, value: 'no test at this sample' })
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
        label: `${theme.freshLabel} (Mbps)`,
        stroke: theme.vpn,
        paths: () => null,
        points: { show: true, size: 9, width: 2, stroke: theme.vpn, fill: theme.vpn },
      },
      {
        label: `${theme.cachedLabel} (Mbps)`,
        stroke: theme.vpn,
        paths: () => null,
        points: { show: true, size: 8, width: 2, stroke: theme.vpn, fill: '#ffffff' },
      },
      {
        label: `${theme.wanLabel.replace(' (host)', '')} (Mbps)`,
        stroke: theme.wan,
        paths: () => null,
        points: { show: true, size: 8, width: 2, stroke: theme.wan, fill: theme.wan },
      },
    ],
  }
}
