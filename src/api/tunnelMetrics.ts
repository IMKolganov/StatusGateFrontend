export type PublicTunnelMetricPoint = {
  checked_at: string
  outcome: string
  latency_ms?: number | null
  connect_time_ms?: number | null
  exit_ip?: string | null
  probe_latency_ms?: number | null
  google_probe_ok?: boolean | null
  google_probe_latency_ms?: number | null
  gateway_ping_avg_ms?: number | null
  gateway_ping_jitter_ms?: number | null
  gateway_ping_loss_percent?: number | null
  download_mbps?: number | null
  download_bytes?: number | null
  download_duration_ms?: number | null
  download_cached?: boolean | null
  speed_test_ok?: boolean | null
  speed_test_measured_at?: string | null
}

/** One minute of the continuous in-tunnel pinger (1 packet/second). */
export type PublicTunnelPingSample = {
  bucket_start: string
  /** 'gateway' (first VPN hop) or 'internet' (host beyond the exit). */
  target: string
  target_host?: string | null
  samples_sent: number
  samples_received: number
  loss_percent?: number | null
  min_ms?: number | null
  avg_ms?: number | null
  max_ms?: number | null
  jitter_ms?: number | null
}

export type PublicTunnelLatestDiagnostics = {
  checked_at?: string | null
  outcome?: string | null
  exit_ip?: string | null
  connect_time_ms?: number | null
  probe_latency_ms?: number | null
  google_probe_ok?: boolean | null
  google_probe_latency_ms?: number | null
  gateway_ping_avg_ms?: number | null
  gateway_ping_jitter_ms?: number | null
  gateway_ping_loss_percent?: number | null
  download_mbps?: number | null
  download_bytes?: number | null
  download_duration_ms?: number | null
  speed_test_ok?: boolean | null
  speed_test_error?: string | null
  speed_test_measured_at?: string | null
  speed_test_last_success_at?: string | null
  speed_test_showing_last_success?: boolean | null
  speed_test_min_mbps?: number | null
  speed_test_max_mbps?: number | null
  speed_test_avg_mbps?: number | null
  speed_test_sample_count?: number | null
  fresh_speed_tests_in_window?: number
  uptime_percent?: number | null
}

export type PublicTunnelConnectionEvent = {
  id?: string
  occurred_at: string
  event_type: string
  outcome?: string | null
  message?: string | null
}

export type PublicTunnelMetrics = {
  project_slug: string
  service_id: string
  service_name: string
  service_slug: string
  component_kind: string
  range_start: string
  range_end: string
  hours: number
  latest?: PublicTunnelLatestDiagnostics | null
  points: PublicTunnelMetricPoint[]
  ping_samples?: PublicTunnelPingSample[]
  events: PublicTunnelConnectionEvent[]
}
