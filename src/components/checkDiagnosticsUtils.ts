import type { NetworkSummary } from '../api/client'

export function logTailFromDetails(details: Record<string, unknown> | null | undefined): string | null {
  if (!details) return null
  const tail = details.log_tail
  return typeof tail === 'string' && tail.trim() ? tail : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function numField(raw: Record<string, unknown>, key: string): number | undefined {
  return typeof raw[key] === 'number' ? raw[key] : undefined
}

function strField(raw: Record<string, unknown>, key: string): string | undefined {
  return typeof raw[key] === 'string' ? raw[key] : undefined
}

function boolField(raw: Record<string, unknown>, key: string): boolean | undefined {
  return typeof raw[key] === 'boolean' ? raw[key] : undefined
}

function isMeaningfulSpeed(payload: Record<string, unknown> | null): boolean {
  if (!payload || payload.ok !== true) return false
  const mbps = payload.mbps
  const bytes = payload.bytes
  return typeof mbps === 'number' && mbps > 0 && typeof bytes === 'number' && bytes > 0
}

function projectSpeedSeries(
  speedTest: Record<string, unknown> | null,
  lastSuccess: Record<string, unknown> | null,
  emptyError: string,
): {
  ok?: boolean
  error?: string
  mbps?: number
  bytes?: number
  duration_ms?: number
  showing_last_success?: boolean
  measured_at?: string
  last_success_at?: string
} {
  if (!speedTest) return {}

  let ok: boolean | undefined
  let error: string | undefined
  let mbps = typeof speedTest.mbps === 'number' ? speedTest.mbps : undefined
  let bytes = typeof speedTest.bytes === 'number' ? speedTest.bytes : undefined
  let durationMs = typeof speedTest.duration_ms === 'number' ? speedTest.duration_ms : undefined
  let showingLastSuccess = false
  const measuredAt = typeof speedTest.measured_at === 'string' ? speedTest.measured_at : undefined
  let lastSuccessAt = typeof lastSuccess?.measured_at === 'string' ? lastSuccess.measured_at : undefined

  const takeLastSuccess = () => {
    if (!isMeaningfulSpeed(lastSuccess)) return
    mbps = typeof lastSuccess!.mbps === 'number' ? lastSuccess!.mbps : undefined
    bytes = typeof lastSuccess!.bytes === 'number' ? lastSuccess!.bytes : undefined
    durationMs = typeof lastSuccess!.duration_ms === 'number' ? lastSuccess!.duration_ms : undefined
    ok = true
    showingLastSuccess = true
    if (typeof lastSuccess!.measured_at === 'string') lastSuccessAt = lastSuccess!.measured_at
  }

  if (isMeaningfulSpeed(speedTest)) {
    ok = true
  } else if (speedTest.ok === true) {
    ok = false
    error = typeof speedTest.error === 'string' && speedTest.error ? speedTest.error : emptyError
    mbps = undefined
    takeLastSuccess()
  } else if (speedTest.ok === false) {
    ok = false
    error = typeof speedTest.error === 'string' && speedTest.error ? speedTest.error : 'Speed test failed'
    takeLastSuccess()
  }

  if (isMeaningfulSpeed(speedTest) && (speedTest.cached || speedTest.deferred || speedTest.stale)) {
    showingLastSuccess = Boolean(speedTest.cached || speedTest.stale || speedTest.throttled || speedTest.deferred)
    if (!lastSuccessAt && measuredAt) lastSuccessAt = measuredAt
  }
  if (showingLastSuccess && !lastSuccessAt && measuredAt) lastSuccessAt = measuredAt
  if (isMeaningfulSpeed(speedTest) && !lastSuccessAt && measuredAt && !speedTest.cached) {
    lastSuccessAt = measuredAt
  }

  return {
    ok,
    error,
    mbps,
    bytes,
    duration_ms: durationMs,
    showing_last_success: showingLastSuccess || undefined,
    measured_at: measuredAt,
    last_success_at: lastSuccessAt,
  }
}

function projectDirect(payload: Record<string, unknown> | null): {
  mbps?: number
  bytes?: number
  duration_ms?: number
  cached?: boolean
  measured_at?: string
} {
  if (!payload) return {}
  if (!isMeaningfulSpeed(payload)) {
    return {
      measured_at: typeof payload.measured_at === 'string' ? payload.measured_at : undefined,
    }
  }
  return {
    mbps: typeof payload.mbps === 'number' ? payload.mbps : undefined,
    bytes: typeof payload.bytes === 'number' ? payload.bytes : undefined,
    duration_ms: typeof payload.duration_ms === 'number' ? payload.duration_ms : undefined,
    cached: Boolean(payload.cached || payload.deferred || payload.stale) || undefined,
    measured_at: typeof payload.measured_at === 'string' ? payload.measured_at : undefined,
  }
}

function statsField(stats: Record<string, unknown> | null, key: string): number | undefined {
  const value = stats?.[key]
  return typeof value === 'number' ? value : undefined
}

/** Project flat NetworkSummary-shaped records (already projected API fields). */
export function networkSummaryFromRecord(raw: Record<string, unknown> | null | undefined): NetworkSummary | null {
  if (!raw) return null

  const summary: NetworkSummary = {
    interface: strField(raw, 'interface'),
    ipv4_address: strField(raw, 'ipv4_address'),
    gateway: strField(raw, 'gateway'),
    dns_servers: Array.isArray(raw.dns_servers)
      ? raw.dns_servers.filter((item): item is string => typeof item === 'string')
      : undefined,
    mtu: numField(raw, 'mtu'),
    connect_time_ms: numField(raw, 'connect_time_ms'),
    proxy_url: strField(raw, 'proxy_url'),
    inbound_protocol: strField(raw, 'inbound_protocol'),
    probe_url: strField(raw, 'probe_url'),
    exit_ip: strField(raw, 'exit_ip'),
    probe_latency_ms: numField(raw, 'probe_latency_ms'),
    gateway_ping_avg_ms: numField(raw, 'gateway_ping_avg_ms'),
    gateway_ping_loss_percent: numField(raw, 'gateway_ping_loss_percent'),
    gateway_ping_jitter_ms: numField(raw, 'gateway_ping_jitter_ms'),
    download_mbps: numField(raw, 'download_mbps'),
    download_bytes: numField(raw, 'download_bytes'),
    download_duration_ms: numField(raw, 'download_duration_ms'),
    speed_test_ok: boolField(raw, 'speed_test_ok'),
    speed_test_error: strField(raw, 'speed_test_error'),
    speed_test_measured_at: strField(raw, 'speed_test_measured_at'),
    speed_test_last_success_at: strField(raw, 'speed_test_last_success_at'),
    speed_test_showing_last_success: boolField(raw, 'speed_test_showing_last_success'),
    speed_test_min_mbps: numField(raw, 'speed_test_min_mbps'),
    speed_test_max_mbps: numField(raw, 'speed_test_max_mbps'),
    speed_test_avg_mbps: numField(raw, 'speed_test_avg_mbps'),
    speed_test_sample_count: numField(raw, 'speed_test_sample_count'),
    upload_mbps: numField(raw, 'upload_mbps'),
    upload_bytes: numField(raw, 'upload_bytes'),
    upload_duration_ms: numField(raw, 'upload_duration_ms'),
    upload_speed_test_ok: boolField(raw, 'upload_speed_test_ok'),
    upload_speed_test_error: strField(raw, 'upload_speed_test_error'),
    upload_speed_test_measured_at: strField(raw, 'upload_speed_test_measured_at'),
    upload_speed_test_last_success_at: strField(raw, 'upload_speed_test_last_success_at'),
    upload_speed_test_showing_last_success: boolField(raw, 'upload_speed_test_showing_last_success'),
    upload_speed_test_min_mbps: numField(raw, 'upload_speed_test_min_mbps'),
    upload_speed_test_max_mbps: numField(raw, 'upload_speed_test_max_mbps'),
    upload_speed_test_avg_mbps: numField(raw, 'upload_speed_test_avg_mbps'),
    upload_speed_test_sample_count: numField(raw, 'upload_speed_test_sample_count'),
    direct_download_mbps: numField(raw, 'direct_download_mbps'),
    direct_download_bytes: numField(raw, 'direct_download_bytes'),
    direct_download_duration_ms: numField(raw, 'direct_download_duration_ms'),
    direct_download_cached: boolField(raw, 'direct_download_cached'),
    direct_download_measured_at: strField(raw, 'direct_download_measured_at'),
    direct_upload_mbps: numField(raw, 'direct_upload_mbps'),
    direct_upload_bytes: numField(raw, 'direct_upload_bytes'),
    direct_upload_duration_ms: numField(raw, 'direct_upload_duration_ms'),
    direct_upload_cached: boolField(raw, 'direct_upload_cached'),
    direct_upload_measured_at: strField(raw, 'direct_upload_measured_at'),
    direct_speed_test_skip_reason: strField(raw, 'direct_speed_test_skip_reason'),
  }

  return Object.values(summary).some((value) => value != null && value !== '' && !(Array.isArray(value) && value.length === 0))
    ? summary
    : null
}

/** Project nested check ``details.network`` (raw VPN check payload) into NetworkSummary. */
export function networkSummaryFromDetails(
  details: Record<string, unknown> | null | undefined,
): NetworkSummary | null {
  if (!details) return null
  const network = asRecord(details.network)
  if (!network) return null

  const probe = asRecord(network.probe) ?? {}
  const gatewayPing = asRecord(network.gateway_ping) ?? {}
  const download = projectSpeedSeries(
    asRecord(network.speed_test),
    asRecord(network.speed_test_last_success),
    'Speed test downloaded no data',
  )
  const upload = projectSpeedSeries(
    asRecord(network.speed_test_upload),
    asRecord(network.speed_test_upload_last_success),
    'Speed test uploaded no data',
  )
  const stats = asRecord(network.speed_test_stats)
  const uploadStats = asRecord(network.speed_test_upload_stats)
  const directDownload = projectDirect(asRecord(network.direct_speed_test))
  const directUpload = projectDirect(asRecord(network.direct_speed_test_upload))
  const measuredAtFallback =
    typeof network.direct_speed_test_measured_at === 'string'
      ? network.direct_speed_test_measured_at
      : undefined

  return networkSummaryFromRecord({
    interface: network.interface,
    ipv4_address: network.ipv4_address,
    gateway: network.gateway,
    dns_servers: network.dns_servers,
    mtu: network.mtu,
    connect_time_ms: network.connect_time_ms,
    proxy_url: network.proxy_url,
    inbound_protocol: network.inbound_protocol,
    probe_url: probe.url,
    exit_ip: probe.exit_ip,
    probe_latency_ms: probe.latency_ms,
    gateway_ping_avg_ms: gatewayPing.avg_ms,
    gateway_ping_loss_percent: gatewayPing.loss_percent,
    gateway_ping_jitter_ms: gatewayPing.jitter_ms,
    download_mbps: download.mbps,
    download_bytes: download.bytes,
    download_duration_ms: download.duration_ms,
    speed_test_ok: download.ok,
    speed_test_error: download.error,
    speed_test_measured_at: download.measured_at,
    speed_test_last_success_at: download.last_success_at,
    speed_test_showing_last_success: download.showing_last_success,
    speed_test_min_mbps: statsField(stats, 'min_mbps'),
    speed_test_max_mbps: statsField(stats, 'max_mbps'),
    speed_test_avg_mbps: statsField(stats, 'avg_mbps'),
    speed_test_sample_count: statsField(stats, 'sample_count'),
    upload_mbps: upload.mbps,
    upload_bytes: upload.bytes,
    upload_duration_ms: upload.duration_ms,
    upload_speed_test_ok: upload.ok,
    upload_speed_test_error: upload.error,
    upload_speed_test_measured_at: upload.measured_at,
    upload_speed_test_last_success_at: upload.last_success_at,
    upload_speed_test_showing_last_success: upload.showing_last_success,
    upload_speed_test_min_mbps: statsField(uploadStats, 'min_mbps'),
    upload_speed_test_max_mbps: statsField(uploadStats, 'max_mbps'),
    upload_speed_test_avg_mbps: statsField(uploadStats, 'avg_mbps'),
    upload_speed_test_sample_count: statsField(uploadStats, 'sample_count'),
    direct_download_mbps: directDownload.mbps,
    direct_download_bytes: directDownload.bytes,
    direct_download_duration_ms: directDownload.duration_ms,
    direct_download_cached: directDownload.cached,
    direct_download_measured_at: directDownload.measured_at ?? measuredAtFallback,
    direct_upload_mbps: directUpload.mbps,
    direct_upload_bytes: directUpload.bytes,
    direct_upload_duration_ms: directUpload.duration_ms,
    direct_upload_cached: directUpload.cached,
    direct_upload_measured_at: directUpload.measured_at,
    direct_speed_test_skip_reason: network.direct_speed_test_skip_reason,
  })
}
