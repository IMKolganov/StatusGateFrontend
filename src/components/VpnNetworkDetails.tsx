import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { NetworkSummary } from '../api/generated/models/networkSummary'
import { formatSpeedTestError } from '../utils/speedTestError'

export type { NetworkSummary }

type NetworkDetailsProps = {
  summary: NetworkSummary
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  summaryLabel?: string
  /** Public live tunnel chart URL when gateway ping is available. */
  tunnelHref?: string | null
}

export function hasGatewayPing(summary: NetworkSummary): boolean {
  return (
    summary.gateway_ping_avg_ms != null
    || summary.gateway_ping_jitter_ms != null
    || summary.gateway_ping_loss_percent != null
  )
}

function formatBytes(value: number): string {
  if (value >= 1_048_576) return `${(value / 1_048_576).toFixed(2)} MiB`
  if (value >= 1024) return `${(value / 1024).toFixed(0)} KiB`
  return `${value} B`
}

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function buildSpeedTestDetails(summary: NetworkSummary): string[] {
  const lines: string[] = []
  const lastSuccessAt = formatTimestamp(summary.speed_test_last_success_at ?? summary.speed_test_measured_at)
  const lastAttemptAt = formatTimestamp(summary.speed_test_measured_at)

  if (summary.download_mbps != null && Number(summary.download_mbps) > 0) {
    lines.push(`Displayed: ${Number(summary.download_mbps).toFixed(2)} Mbps`)
  }
  if (
    summary.download_bytes != null
    && summary.download_duration_ms != null
  ) {
    lines.push(`Transfer: ${formatBytes(Number(summary.download_bytes))} in ${summary.download_duration_ms} ms`)
  }
  if (summary.speed_test_min_mbps != null) {
    lines.push(`Min: ${Number(summary.speed_test_min_mbps).toFixed(2)} Mbps`)
  }
  if (summary.speed_test_avg_mbps != null) {
    const samples = summary.speed_test_sample_count
    const suffix = samples != null && samples > 0 ? ` (${samples} samples)` : ''
    lines.push(`Average: ${Number(summary.speed_test_avg_mbps).toFixed(2)} Mbps${suffix}`)
  }
  if (summary.speed_test_max_mbps != null) {
    lines.push(`Max: ${Number(summary.speed_test_max_mbps).toFixed(2)} Mbps`)
  }
  if (lastSuccessAt) {
    lines.push(`Last successful: ${lastSuccessAt}`)
  } else if (summary.speed_test_showing_last_success) {
    lines.push('Last successful: time not recorded yet (appears after the next live speed test).')
  }
  if (lastAttemptAt && lastAttemptAt !== lastSuccessAt) {
    lines.push(`Last attempt: ${lastAttemptAt}`)
  }
  if (summary.speed_test_showing_last_success) {
    if (summary.speed_test_error) {
      lines.push('Showing last successful measurement after a failed live test.')
    } else {
      lines.push('Live test deferred (stagger / rate limit); showing previous measurement.')
    }
  }
  if (summary.speed_test_error) {
    lines.push(`Last error: ${formatSpeedTestError(summary.speed_test_error)}`)
  }
  return lines
}

function formatMbpsValue(
  mbps: number | null | undefined,
  options?: { cached?: boolean | null },
): string | null {
  if (mbps != null && Number(mbps) > 0) {
    const base = `${Number(mbps).toFixed(2)} Mbps`
    return options?.cached ? `${base} (cached)` : base
  }
  return null
}

function formatDownloadSpeed(summary: NetworkSummary): string | null {
  if (summary.download_mbps != null && Number(summary.download_mbps) > 0) {
    const base = `${Number(summary.download_mbps).toFixed(2)} Mbps`
    return summary.speed_test_showing_last_success ? `${base} (cached)` : base
  }
  if (summary.speed_test_ok === false || (summary.download_mbps != null && Number(summary.download_mbps) <= 0)) {
    const reason = formatSpeedTestError(
      summary.speed_test_error
      || (summary.download_mbps != null && Number(summary.download_mbps) <= 0
        ? 'Speed test downloaded no data'
        : null),
    )
    if (/deferred/i.test(reason)) {
      return reason
    }
    return `Could not measure speed: ${reason}`
  }
  return null
}

function formatUploadSpeed(summary: NetworkSummary): string | null {
  if (summary.upload_mbps != null && Number(summary.upload_mbps) > 0) {
    const base = `${Number(summary.upload_mbps).toFixed(2)} Mbps`
    return summary.upload_speed_test_showing_last_success ? `${base} (cached)` : base
  }
  if (summary.upload_speed_test_ok === false) {
    const reason = formatSpeedTestError(summary.upload_speed_test_error)
    if (/deferred/i.test(reason)) return reason
    return `Could not measure upload: ${reason}`
  }
  return null
}

function SpeedTestValue({
  value,
  details,
}: {
  value: string
  details: string[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (details.length === 0) return <>{value}</>

  return (
    <div className="network-summary__speed" ref={rootRef}>
      <button
        type="button"
        className="network-summary__speed-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        {value}
      </button>
      {open && (
        <div
          id={panelId}
          className="network-summary__speed-popover"
          role="dialog"
          aria-label="Speed test details"
        >
          <div className="network-summary__speed-popover-title">Speed test details</div>
          <ul className="network-summary__speed-meta">
            {details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function VpnNetworkDetails({
  summary,
  className = '',
  collapsible = false,
  defaultOpen = false,
  summaryLabel = 'Network details',
  tunnelHref = null,
}: NetworkDetailsProps) {
  const rows: Array<[string, string, string[]?]> = []

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
  if (downloadSpeed) {
    rows.push(['VPN download', downloadSpeed, buildSpeedTestDetails(summary)])
  }

  const uploadSpeed = formatUploadSpeed(summary)
  if (uploadSpeed) {
    rows.push(['VPN upload', uploadSpeed])
  }

  const wanDownload = formatMbpsValue(summary.direct_download_mbps, {
    cached: summary.direct_download_cached,
  })
  if (wanDownload) {
    rows.push(['WAN download', wanDownload])
  }

  const wanUpload = formatMbpsValue(summary.direct_upload_mbps, {
    cached: summary.direct_upload_cached,
  })
  if (wanUpload) {
    rows.push(['WAN upload', wanUpload])
  }

  if (
    summary.speed_test_ok === true
    && summary.download_bytes != null
    && summary.download_duration_ms != null
    && !summary.speed_test_showing_last_success
  ) {
    rows.push(['Speed test', `${formatBytes(Number(summary.download_bytes))} in ${summary.download_duration_ms} ms`])
  }

  if (summary.exit_ip) rows.push(['Exit IP', String(summary.exit_ip)])
  if (summary.probe_latency_ms != null) rows.push(['Probe latency', `${summary.probe_latency_ms} ms`])
  if (summary.probe_url) rows.push(['Probe URL', String(summary.probe_url)])

  const showTunnelLink = Boolean(tunnelHref && hasGatewayPing(summary))
  if (rows.length === 0 && !showTunnelLink) return null

  const content = (
    <>
      {rows.length > 0 && (
        <dl className={collapsible ? 'network-summary' : `network-summary ${className}`.trim()}>
          {rows.map(([label, value, details]) => (
            <div key={label} className="network-summary__row">
              <dt>{label}</dt>
              <dd>
                {details && details.length > 0 ? (
                  <SpeedTestValue value={value} details={details} />
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {showTunnelLink && tunnelHref && (
        <p className="network-summary__tunnel-link">
          <Link to={tunnelHref}>Tunnel live (2h)</Link>
        </p>
      )}
    </>
  )

  if (!collapsible) {
    return className ? <div className={className}>{content}</div> : content
  }

  return (
    <details className={`network-summary-details ${className}`.trim()} open={defaultOpen}>
      <summary>{summaryLabel}</summary>
      {content}
    </details>
  )
}
