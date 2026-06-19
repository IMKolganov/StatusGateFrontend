export type NetworkSummary = {
  interface?: string
  ipv4_address?: string
  gateway?: string
  dns_servers?: string[]
  mtu?: number
  connect_time_ms?: number
  proxy_url?: string
  inbound_protocol?: string
  probe_url?: string
  exit_ip?: string
  probe_latency_ms?: number
  gateway_ping_avg_ms?: number
  gateway_ping_loss_percent?: number
  gateway_ping_jitter_ms?: number
  download_mbps?: number
  download_bytes?: number
  download_duration_ms?: number
}

type NetworkDetailsProps = {
  summary: NetworkSummary
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  summaryLabel?: string
}

function formatBytes(value: number): string {
  if (value >= 1_048_576) return `${(value / 1_048_576).toFixed(2)} MiB`
  if (value >= 1024) return `${(value / 1024).toFixed(0)} KiB`
  return `${value} B`
}

export function VpnNetworkDetails({
  summary,
  className = '',
  collapsible = false,
  defaultOpen = false,
  summaryLabel = 'Network details',
}: NetworkDetailsProps) {
  const rows: Array<[string, string]> = []

  if (summary.interface) rows.push(['Interface', summary.interface])
  if (summary.ipv4_address) rows.push(['VPN IP', summary.ipv4_address])
  if (summary.gateway) rows.push(['Gateway', summary.gateway])
  if (summary.mtu != null) rows.push(['MTU', String(summary.mtu)])
  if (summary.dns_servers?.length) rows.push(['DNS', summary.dns_servers.join(', ')])
  if (summary.proxy_url) rows.push(['Proxy', summary.proxy_url])
  if (summary.inbound_protocol) rows.push(['Inbound', summary.inbound_protocol])
  if (summary.connect_time_ms != null) rows.push(['Connect time', `${summary.connect_time_ms} ms`])
  if (summary.gateway_ping_avg_ms != null) rows.push(['Gateway ping', `${summary.gateway_ping_avg_ms.toFixed(1)} ms`])
  if (summary.gateway_ping_jitter_ms != null) rows.push(['Jitter', `${summary.gateway_ping_jitter_ms.toFixed(1)} ms`])
  if (summary.gateway_ping_loss_percent != null) rows.push(['Packet loss', `${summary.gateway_ping_loss_percent}%`])
  if (summary.download_mbps != null) rows.push(['Download speed', `${summary.download_mbps.toFixed(2)} Mbps`])
  if (summary.download_bytes != null && summary.download_duration_ms != null) {
    rows.push(['Speed test', `${formatBytes(summary.download_bytes)} in ${summary.download_duration_ms} ms`])
  }
  if (summary.exit_ip) rows.push(['Exit IP', summary.exit_ip])
  if (summary.probe_latency_ms != null) rows.push(['Probe latency', `${summary.probe_latency_ms} ms`])
  if (summary.probe_url) rows.push(['Probe URL', summary.probe_url])

  if (rows.length === 0) return null

  const content = (
    <dl className={collapsible ? 'network-summary' : `network-summary ${className}`.trim()}>
      {rows.map(([label, value]) => (
        <div key={label} className="network-summary__row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )

  if (!collapsible) return content

  return (
    <details className={`network-summary-details ${className}`.trim()} open={defaultOpen}>
      <summary>{summaryLabel}</summary>
      {content}
    </details>
  )
}
