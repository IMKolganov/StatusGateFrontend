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
