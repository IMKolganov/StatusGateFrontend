import { VpnNetworkDetails, type NetworkSummary } from './VpnNetworkDetails'
import './CheckDiagnostics.css'

type CheckDiagnosticsProps = {
  outcome?: string | null
  errorMessage?: string | null
  logTail?: string | null
  networkSummary?: NetworkSummary | null
  className?: string
}

export function CheckDiagnostics({
  outcome,
  errorMessage,
  logTail,
  networkSummary,
  className = '',
}: CheckDiagnosticsProps) {
  const hasContent = Boolean(errorMessage || logTail || networkSummary)
  if (!hasContent) return null

  const failed = Boolean(outcome && outcome !== 'up' && outcome !== 'degraded')

  return (
    <div className={`check-diagnostics ${failed ? 'check-diagnostics--failed' : ''} ${className}`.trim()}>
      {errorMessage && (
        <p className="check-diagnostics__error">{errorMessage}</p>
      )}
      {networkSummary && (
        <VpnNetworkDetails summary={networkSummary} className="network-summary--alert" />
      )}
      {logTail && (
        <details className="check-diagnostics__logs" open={failed}>
          <summary>Process logs</summary>
          <pre className="check-log">{logTail}</pre>
        </details>
      )}
    </div>
  )
}

export function logTailFromDetails(details: Record<string, unknown> | null | undefined): string | null {
  if (!details) return null
  const tail = details.log_tail
  return typeof tail === 'string' && tail.trim() ? tail : null
}
