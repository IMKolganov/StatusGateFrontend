import type {
  PublicTunnelConnectionEvent,
  PublicTunnelMetricPoint,
  PublicTunnelPingSample,
} from '../../api/tunnelMetrics'

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
  /**
   * Download throughput:
   * [x, vpnFresh, vpnCached, wanDownload]
   */
  throughput: (number | null)[][]
  /**
   * Upload throughput:
   * [x, vpnFresh, vpnCached, wanUpload]
   */
  uploadThroughput: (number | null)[][]
  /** Unix seconds of samples whose outcome was an outage. */
  outages: number[]
  hasPing: boolean
  hasLoss: boolean
  /** Any download samples (fresh, cached, or WAN) in the window. */
  speedSampleCount: number
  freshSpeedCount: number
  uploadSampleCount: number
  freshUploadCount: number
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
  wanDownload: number | null
  uploadFresh: number | null
  uploadCached: number | null
  wanUpload: number | null
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

  let uploadFresh: number | null = null
  let uploadCached: number | null = null
  const uploadMbps = num(point.upload_mbps)
  if (!isOutage && uploadMbps != null && uploadMbps > 0) {
    if (point.upload_cached === true) {
      uploadCached = uploadMbps
    } else {
      uploadFresh = uploadMbps
    }
  }

  const wanDownload =
    !isOutage && num(point.direct_download_mbps) != null && Number(point.direct_download_mbps) > 0
      ? num(point.direct_download_mbps)
      : null
  const wanUpload =
    !isOutage && num(point.direct_upload_mbps) != null && Number(point.direct_upload_mbps) > 0
      ? num(point.direct_upload_mbps)
      : null

  return {
    x: toSeconds(point.checked_at),
    ping: isOutage ? null : num(point.gateway_ping_avg_ms),
    jitter: isOutage ? null : num(point.gateway_ping_jitter_ms),
    loss: isOutage ? null : num(point.gateway_ping_loss_percent),
    fresh,
    cached,
    wanDownload,
    uploadFresh,
    uploadCached,
    wanUpload,
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
  const wanDownload: (number | null)[] = []
  const uploadFresh: (number | null)[] = []
  const uploadCached: (number | null)[] = []
  const wanUpload: (number | null)[] = []
  const outages: number[] = []

  const pushNullRow = (x: number) => {
    xs.push(x)
    ping.push(null)
    jitter.push(null)
    loss.push(null)
    fresh.push(null)
    cached.push(null)
    wanDownload.push(null)
    uploadFresh.push(null)
    uploadCached.push(null)
    wanUpload.push(null)
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
    wanDownload.push(row.wanDownload)
    uploadFresh.push(row.uploadFresh)
    uploadCached.push(row.uploadCached)
    wanUpload.push(row.wanUpload)
    if (row.isOutage) outages.push(row.x)
    prevX = row.x
  }

  const freshSpeedCount = fresh.filter((value) => value != null).length
  const cachedSpeedCount = cached.filter((value) => value != null).length
  const wanDownloadCount = wanDownload.filter((value) => value != null).length
  const freshUploadCount = uploadFresh.filter((value) => value != null).length
  const cachedUploadCount = uploadCached.filter((value) => value != null).length
  const wanUploadCount = wanUpload.filter((value) => value != null).length

  return {
    ping: [xs, ping, jitter],
    loss: [xs, loss],
    throughput: [xs, fresh, cached, wanDownload],
    uploadThroughput: [xs, uploadFresh, uploadCached, wanUpload],
    outages,
    hasPing: ping.some((value) => value != null),
    hasLoss: loss.some((value) => value != null),
    speedSampleCount: freshSpeedCount + cachedSpeedCount + wanDownloadCount,
    freshSpeedCount,
    uploadSampleCount: freshUploadCount + cachedUploadCount + wanUploadCount,
    freshUploadCount,
  }
}

export type ContinuousPingData = {
  /** [x, gateway avg, internet avg, gateway max, internet max] */
  ping: (number | null)[][]
  /** [x, gateway loss, internet loss] */
  loss: (number | null)[][]
  hasGateway: boolean
  hasInternet: boolean
  sampleCount: number
}

type ContinuousBucket = {
  gatewayAvg: number | null
  gatewayMax: number | null
  gatewayLoss: number | null
  internetAvg: number | null
  internetMax: number | null
  internetLoss: number | null
}

/**
 * Build aligned uPlot data from the continuous pinger's per-minute aggregates.
 * Gateway and internet rows for the same minute are merged into one x value;
 * holes larger than a couple of minutes break the line with an explicit null.
 */
export function buildContinuousPingData(samples: PublicTunnelPingSample[]): ContinuousPingData {
  const num = (value: number | null | undefined): number | null =>
    value != null && Number.isFinite(value) ? Number(value) : null

  const buckets = new Map<number, ContinuousBucket>()
  for (const sample of samples) {
    const x = toSeconds(sample.bucket_start)
    let bucket = buckets.get(x)
    if (!bucket) {
      bucket = {
        gatewayAvg: null,
        gatewayMax: null,
        gatewayLoss: null,
        internetAvg: null,
        internetMax: null,
        internetLoss: null,
      }
      buckets.set(x, bucket)
    }
    if (sample.target === 'gateway') {
      bucket.gatewayAvg = num(sample.avg_ms)
      bucket.gatewayMax = num(sample.max_ms)
      bucket.gatewayLoss = num(sample.loss_percent)
    } else if (sample.target === 'internet') {
      bucket.internetAvg = num(sample.avg_ms)
      bucket.internetMax = num(sample.max_ms)
      bucket.internetLoss = num(sample.loss_percent)
    }
  }

  const sortedXs = [...buckets.keys()].sort((a, b) => a - b)

  const xs: number[] = []
  const gatewayAvg: (number | null)[] = []
  const internetAvg: (number | null)[] = []
  const gatewayMax: (number | null)[] = []
  const internetMax: (number | null)[] = []
  const gatewayLoss: (number | null)[] = []
  const internetLoss: (number | null)[] = []

  const pushNullRow = (x: number) => {
    xs.push(x)
    gatewayAvg.push(null)
    internetAvg.push(null)
    gatewayMax.push(null)
    internetMax.push(null)
    gatewayLoss.push(null)
    internetLoss.push(null)
  }

  // Buckets are minute-aligned, so anything beyond ~2.5 minutes is a real hole.
  const gapSeconds = 150
  let prevX: number | null = null
  for (const x of sortedXs) {
    if (prevX != null && x - prevX > gapSeconds) {
      pushNullRow(prevX + 1)
    }
    const bucket = buckets.get(x)
    if (!bucket) continue
    xs.push(x)
    gatewayAvg.push(bucket.gatewayAvg)
    internetAvg.push(bucket.internetAvg)
    gatewayMax.push(bucket.gatewayMax)
    internetMax.push(bucket.internetMax)
    gatewayLoss.push(bucket.gatewayLoss)
    internetLoss.push(bucket.internetLoss)
    prevX = x
  }

  return {
    ping: [xs, gatewayAvg, internetAvg, gatewayMax, internetMax],
    loss: [xs, gatewayLoss, internetLoss],
    hasGateway: gatewayAvg.some((value) => value != null) || gatewayLoss.some((value) => value != null),
    hasInternet: internetAvg.some((value) => value != null) || internetLoss.some((value) => value != null),
    sampleCount: samples.length,
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
