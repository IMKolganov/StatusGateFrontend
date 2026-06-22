import type { NetworkSummary } from '../api/generated/models/networkSummary'

export type { NetworkSummary }

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

function formatDownloadSpeed(summary: NetworkSummary): string | null {
  if (summary.download_mbps != null) {
    return `${Number(summary.download_mbps).toFixed(2)} Mbps`
  }
  if (summary.speed_test_ok === false) {
    const reason = summary.speed_test_error?.trim() || 'Unknown error'
    return `Could not measure speed: ${reason}`
  }
  return null
}

export function VpnNetworkDetails({
  summary,
  className = '',
  collapsible = false,
  defaultOpen = false,
  summaryLabel = 'Network details',
}: NetworkDetailsProps) {
  const rows: Array<[string, string]> = []

  if (summary.interface) rows.push(['Interface', String(summary.interface)])
  if (summary.ipv4_address) rows.push(['VPN IP', String(summary.ipv4_address)])
  if (summary.gateway) rows.push(['Gateway', String(summary.gateway)])
  if (summary.mtu != null) rows.push(['MTU', String(summary.mtu)])
  if (summary.dns_servers?.length) rows.push(['DNS', summary.dns_servers.map(String).join(', ')])
  if (summary.proxy_url) rows.push(['Proxy', String(summary.proxy_url)])
  if (summary.inbound_protocol) rows.push(['Inbound', String(summary.inbound_protocol)])
  if (summary.connect_time_ms != null) rows.push(['Connect time', `${summary.connect_time_ms} ms`])
  if (summary.gateway_ping_avg_ms != null) {
    rows.push(['Gateway ping', `${Number(summary.gateway_ping_avg_ms).toFixed(1)} ms`])
  }
  if (summary.gateway_ping_jitter_ms != null) {
    rows.push(['Jitter', `${Number(summary.gateway_ping_jitter_ms).toFixed(1)} ms`])
  }
  if (summary.gateway_ping_loss_percent != null) {
    rows.push(['Packet loss', `${summary.gateway_ping_loss_percent}%`])
  }

  const downloadSpeed = formatDownloadSpeed(summary)
  if (downloadSpeed) rows.push(['Download speed', downloadSpeed])

  if (
    summary.speed_test_ok === true
    && summary.download_bytes != null
    && summary.download_duration_ms != null
  ) {
    rows.push(['Speed test', `${formatBytes(Number(summary.download_bytes))} in ${summary.download_duration_ms} ms`])
  }

  if (summary.exit_ip) rows.push(['Exit IP', String(summary.exit_ip)])
  if (summary.probe_latency_ms != null) rows.push(['Probe latency', `${summary.probe_latency_ms} ms`])
  if (summary.probe_url) rows.push(['Probe URL', String(summary.probe_url)])

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
