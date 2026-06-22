import { VpnNetworkDetails, type NetworkSummary } from './VpnNetworkDetails'
import './CheckDiagnostics.css'

type CheckDiagnosticsProps = {
  outcome?: string | null
  errorMessage?: string | null
  logTail?: string | null
  networkSummary?: NetworkSummary | null
  className?: string
  collapsible?: boolean
}

export function CheckDiagnostics({
  outcome,
  errorMessage,
  logTail,
  networkSummary,
  className = '',
  collapsible = false,
}: CheckDiagnosticsProps) {
  const hasContent = Boolean(errorMessage || logTail || networkSummary)
  if (!hasContent) return null

  const failed = Boolean(outcome && outcome !== 'up' && outcome !== 'degraded')
  const hasDetails = Boolean(networkSummary || logTail)

  const detailsBody = (
    <>
      {networkSummary && (
        <VpnNetworkDetails summary={networkSummary} className="network-summary--alert" />
      )}
      {logTail && (
        <details className="check-diagnostics__logs" open={failed && !collapsible}>
          <summary>Process logs</summary>
          <pre className="check-log">{logTail}</pre>
        </details>
      )}
    </>
  )

  return (
    <div className={`check-diagnostics ${failed ? 'check-diagnostics--failed' : ''} ${className}`.trim()}>
      {errorMessage && (
        <p className="check-diagnostics__error">{errorMessage}</p>
      )}
      {hasDetails && collapsible ? (
        <details className="check-diagnostics__details" open={failed}>
          <summary>Check details</summary>
          {detailsBody}
        </details>
      ) : (
        detailsBody
      )}
    </div>
  )
}

export function logTailFromDetails(details: Record<string, unknown> | null | undefined): string | null {
  if (!details) return null
  const tail = details.log_tail
  return typeof tail === 'string' && tail.trim() ? tail : null
}

export function networkSummaryFromRecord(raw: Record<string, unknown> | null | undefined): NetworkSummary | null {
  if (!raw) return null

  const num = (key: string) => (typeof raw[key] === 'number' ? raw[key] as number : undefined)
  const str = (key: string) => (typeof raw[key] === 'string' ? raw[key] as string : undefined)
  const bool = (key: string) => (typeof raw[key] === 'boolean' ? raw[key] as boolean : undefined)

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
  }

  return Object.values(summary).some((value) => value != null && value !== '' && !(Array.isArray(value) && value.length === 0))
    ? summary
    : null
}
