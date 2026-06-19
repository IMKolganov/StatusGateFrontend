export type NetworkSummary = {
  interface?: string
  ipv4_address?: string
  gateway?: string
  dns_servers?: string[]
  connect_time_ms?: number
  proxy_url?: string
  inbound_protocol?: string
  probe_url?: string
  exit_ip?: string
  probe_latency_ms?: number
}

type NetworkDetailsProps = {
  summary: NetworkSummary
  className?: string
}

export function VpnNetworkDetails({ summary, className = '' }: NetworkDetailsProps) {
  const rows: Array<[string, string]> = []

  if (summary.interface) rows.push(['Interface', summary.interface])
  if (summary.ipv4_address) rows.push(['VPN IP', summary.ipv4_address])
  if (summary.gateway) rows.push(['Gateway', summary.gateway])
  if (summary.dns_servers?.length) rows.push(['DNS', summary.dns_servers.join(', ')])
  if (summary.proxy_url) rows.push(['Proxy', summary.proxy_url])
  if (summary.inbound_protocol) rows.push(['Inbound', summary.inbound_protocol])
  if (summary.connect_time_ms != null) rows.push(['Connect time', `${summary.connect_time_ms} ms`])
  if (summary.exit_ip) rows.push(['Exit IP', summary.exit_ip])
  if (summary.probe_latency_ms != null) rows.push(['Probe latency', `${summary.probe_latency_ms} ms`])
  if (summary.probe_url) rows.push(['Probe URL', summary.probe_url])

  if (rows.length === 0) return null

  return (
    <dl className={`network-summary ${className}`.trim()}>
      {rows.map(([label, value]) => (
        <div key={label} className="network-summary__row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
