import type { MonitoredComponent } from '../api/client'

/** Matches Cloudflare @cloudflare/speedtest default downloadApiUrl. */
export const DEFAULT_SPEED_TEST_URL_TEMPLATE = 'https://speed.cloudflare.com/__down?bytes={bytes}'

/**
 * Conservative UI hint for server-side polling from one egress IP.
 * Cloudflare does not publish a fixed limit for speed.cloudflare.com; HTTP 429 is returned
 * when too many requests arrive in a short window (see cloudflare/speedtest and Error 429 docs).
 */
export const CLOUDFLARE_SPEED_TEST_GUIDANCE_REQUESTS_PER_MINUTE = 10
export const CLOUDFLARE_SPEED_TEST_MIN_GAP_SECONDS = 60

export function isVpnCheckType(checkType: string | null | undefined): boolean {
  return checkType === 'openvpn' || checkType === 'xray'
}

export function validateSpeedTestUrlTemplate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Speed test URL template is required.'
  if (!trimmed.includes('{bytes}')) return 'Template must include the {bytes} placeholder.'
  if (!trimmed.startsWith('https://')) return 'Speed test URL must use HTTPS.'
  return null
}

export function estimateSpeedTestsPerMinute(
  components: MonitoredComponent[],
  defaultPollIntervalSeconds: number,
  defaultSpeedTestIntervalSeconds: number,
): number {
  let total = 0
  for (const component of components) {
    if (!component.is_active || component.speed_test_enabled === false || !isVpnCheckType(component.check_type)) {
      continue
    }
    const pollInterval = Math.max(component.poll_interval_seconds ?? defaultPollIntervalSeconds, 1)
    const speedInterval = component.speed_test_interval_seconds ?? defaultSpeedTestIntervalSeconds
    const interval = speedInterval <= 0 ? pollInterval : Math.max(pollInterval, speedInterval)
    total += 60 / interval
  }
  return total
}

export function buildLocalSpeedTestWarning(
  components: MonitoredComponent[],
  defaultPollIntervalSeconds: number,
  defaultSpeedTestIntervalSeconds: number,
  usesCloudflareDefault: boolean,
): string | null {
  const activeVpn = components.filter(
    (component) => component.is_active && component.speed_test_enabled !== false && isVpnCheckType(component.check_type),
  )
  if (activeVpn.length === 0 || !usesCloudflareDefault) return null

  const perMinute = estimateSpeedTestsPerMinute(components, defaultPollIntervalSeconds, defaultSpeedTestIntervalSeconds)
  if (perMinute <= CLOUDFLARE_SPEED_TEST_GUIDANCE_REQUESTS_PER_MINUTE) return null

  return (
    `${activeVpn.length} active VPN services may trigger about ${perMinute.toFixed(1)} speed tests per minute ` +
    `on speed.cloudflare.com from this server (Cloudflare has no published limit; HTTP 429 may occur above ~` +
    `${CLOUDFLARE_SPEED_TEST_GUIDANCE_REQUESTS_PER_MINUTE}/min). The worker waits at least ` +
    `${CLOUDFLARE_SPEED_TEST_MIN_GAP_SECONDS}s between Cloudflare tests. Use a custom speed test URL, increase intervals, ` +
    'or reduce polling frequency.'
  )
}

export function usesDefaultCloudflareTemplate(
  component: Pick<MonitoredComponent, 'speed_test_url_template'>,
  defaultTemplate: string,
): boolean {
  const template = (component.speed_test_url_template?.trim() || defaultTemplate.trim())
  return template.startsWith('https://speed.cloudflare.com/')
}
