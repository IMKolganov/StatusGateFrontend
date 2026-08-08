export type PublicTunnelMetricPoint = {
  checked_at: string
  outcome: string
  latency_ms?: number | null
  gateway_ping_avg_ms?: number | null
  gateway_ping_jitter_ms?: number | null
  gateway_ping_loss_percent?: number | null
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
  points: PublicTunnelMetricPoint[]
  events: PublicTunnelConnectionEvent[]
}
