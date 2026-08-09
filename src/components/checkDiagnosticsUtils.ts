import type { NetworkSummary } from '../api/client'

export function logTailFromDetails(details: Record<string, unknown> | null | undefined): string | null {
  if (!details) return null
  const tail = details.log_tail
  return typeof tail === 'string' && tail.trim() ? tail : null
}

export function networkSummaryFromRecord(raw: Record<string, unknown> | null | undefined): NetworkSummary | null {
  if (!raw) return null

  const num = (key: string) => (typeof raw[key] === 'number' ? (raw[key]) : undefined)
  const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key]) : undefined)
  const bool = (key: string) => (typeof raw[key] === 'boolean' ? (raw[key]) : undefined)

  const summary: NetworkSummary = {
    interface: str('interface'),
    ipv4_address: str('ipv4_address'),
    gateway: str('gateway'),
    dns_servers: Array.isArray(raw.dns_servers)
      ? raw.dns_servers.filter((item): item is string => typeof item === 'string')
      : undefined,
    mtu: num('mtu'),
    connect_time_ms: num('connect_time_ms'),
    proxy_url: str('proxy_url'),
    inbound_protocol: str('inbound_protocol'),
    probe_url: str('probe_url'),
    exit_ip: str('exit_ip'),
    probe_latency_ms: num('probe_latency_ms'),
    gateway_ping_avg_ms: num('gateway_ping_avg_ms'),
    gateway_ping_loss_percent: num('gateway_ping_loss_percent'),
    gateway_ping_jitter_ms: num('gateway_ping_jitter_ms'),
    download_mbps: num('download_mbps'),
    download_bytes: num('download_bytes'),
    download_duration_ms: num('download_duration_ms'),
    speed_test_ok: bool('speed_test_ok'),
    speed_test_error: str('speed_test_error'),
    speed_test_measured_at: str('speed_test_measured_at'),
    speed_test_last_success_at: str('speed_test_last_success_at'),
    speed_test_showing_last_success: bool('speed_test_showing_last_success'),
    speed_test_min_mbps: num('speed_test_min_mbps'),
    speed_test_max_mbps: num('speed_test_max_mbps'),
    speed_test_avg_mbps: num('speed_test_avg_mbps'),
    speed_test_sample_count: num('speed_test_sample_count'),
    upload_mbps: num('upload_mbps'),
    upload_bytes: num('upload_bytes'),
    upload_duration_ms: num('upload_duration_ms'),
    upload_speed_test_ok: bool('upload_speed_test_ok'),
    upload_speed_test_error: str('upload_speed_test_error'),
    upload_speed_test_measured_at: str('upload_speed_test_measured_at'),
    upload_speed_test_last_success_at: str('upload_speed_test_last_success_at'),
    upload_speed_test_showing_last_success: bool('upload_speed_test_showing_last_success'),
    upload_speed_test_min_mbps: num('upload_speed_test_min_mbps'),
    upload_speed_test_max_mbps: num('upload_speed_test_max_mbps'),
    upload_speed_test_avg_mbps: num('upload_speed_test_avg_mbps'),
    upload_speed_test_sample_count: num('upload_speed_test_sample_count'),
    direct_download_mbps: num('direct_download_mbps'),
    direct_download_bytes: num('direct_download_bytes'),
    direct_download_duration_ms: num('direct_download_duration_ms'),
    direct_download_cached: bool('direct_download_cached'),
    direct_download_measured_at: str('direct_download_measured_at'),
    direct_upload_mbps: num('direct_upload_mbps'),
    direct_upload_bytes: num('direct_upload_bytes'),
    direct_upload_duration_ms: num('direct_upload_duration_ms'),
    direct_upload_cached: bool('direct_upload_cached'),
    direct_upload_measured_at: str('direct_upload_measured_at'),
    direct_speed_test_skip_reason: str('direct_speed_test_skip_reason'),
  }

  return Object.values(summary).some((value) => value != null && value !== '' && !(Array.isArray(value) && value.length === 0))
    ? summary
    : null
}
