import { describe, expect, it } from 'vitest'
import type { MonitoredComponent } from '../api/client'
import {
  CLOUDFLARE_SPEED_TEST_MIN_GAP_SECONDS,
  buildLocalSpeedTestWarning,
  estimateSpeedTestHttpRequestsPerMinute,
  estimateSpeedTestsPerMinute,
  isCloudflareSpeedTestTemplate,
  isVpnCheckType,
  usesDefaultCloudflareTemplate,
  validateSpeedTestUrlTemplate,
} from './speedTestConfig'

function vpn(partial: Partial<MonitoredComponent> & Pick<MonitoredComponent, 'id' | 'slug'>): MonitoredComponent {
  return {
    project_id: 'p1',
    component_kind_id: 'k1',
    name: partial.slug,
    description: null,
    environment: null,
    check_url: 'https://ifconfig.me/ip',
    check_method: 'GET',
    check_type: 'openvpn',
    check_config: null,
    speed_test_bytes: null,
    speed_test_url_template: null,
    speed_test_interval_seconds: null,
    speed_test_enabled: true,
    expected_status_code: 200,
    timeout_seconds: 30,
    poll_interval_seconds: null,
    connection_mode: 'ephemeral',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...partial,
  } as MonitoredComponent
}

describe('estimateSpeedTestsPerMinute', () => {
  it('caps unbounded (interval 0) services to one live slot per gap window', () => {
    const components = [
      vpn({ id: '1', slug: 'a', speed_test_interval_seconds: 0, poll_interval_seconds: 60 }),
      vpn({ id: '2', slug: 'b', speed_test_interval_seconds: 0, poll_interval_seconds: 60 }),
      vpn({ id: '3', slug: 'c', speed_test_interval_seconds: 0, poll_interval_seconds: 60 }),
    ]
    const perMinute = estimateSpeedTestsPerMinute(components, 60, 3600)
    expect(perMinute).toBeCloseTo(60 / Math.max(60, CLOUDFLARE_SPEED_TEST_MIN_GAP_SECONDS), 6)
  })

  it('uses the fastest unbounded poll interval, not the first component', () => {
    const components = [
      vpn({ id: '1', slug: 'slow', speed_test_interval_seconds: 0, poll_interval_seconds: 300 }),
      vpn({ id: '2', slug: 'fast', speed_test_interval_seconds: 0, poll_interval_seconds: 60 }),
    ]
    expect(estimateSpeedTestsPerMinute(components, 300, 3600)).toBeCloseTo(1, 6)
  })

  it('still sums bounded intervals normally', () => {
    const components = [
      vpn({ id: '1', slug: 'a', speed_test_interval_seconds: 60, poll_interval_seconds: 60 }),
      vpn({ id: '2', slug: 'b', speed_test_interval_seconds: 120, poll_interval_seconds: 60 }),
    ]
    expect(estimateSpeedTestsPerMinute(components, 60, 3600)).toBeCloseTo(1 + 0.5, 6)
  })

  it('doubles HTTP estimate for Cloudflare download+upload', () => {
    const components = [
      vpn({ id: '1', slug: 'a', speed_test_interval_seconds: 60, poll_interval_seconds: 60 }),
    ]
    expect(estimateSpeedTestHttpRequestsPerMinute(components, 60, 3600, true)).toBeCloseTo(2, 6)
    expect(estimateSpeedTestHttpRequestsPerMinute(components, 60, 3600, false)).toBeCloseTo(1, 6)
  })
})

describe('isCloudflareSpeedTestTemplate / warning', () => {
  it('detects the configured Cloudflare origin prefix', () => {
    expect(isCloudflareSpeedTestTemplate('https://speed.cloudflare.com/__down?bytes={bytes}')).toBe(true)
    expect(isCloudflareSpeedTestTemplate('https://cdn.example.com/x?b={bytes}')).toBe(false)
  })

  it('warns using HTTP-request units when many Cloudflare services poll', () => {
    const components = Array.from({ length: 12 }, (_, index) =>
      vpn({
        id: String(index),
        slug: `vpn-${index}`,
        speed_test_interval_seconds: 60,
        poll_interval_seconds: 60,
      }),
    )
    const warning = buildLocalSpeedTestWarning(components, 60, 60, true)
    expect(warning).toMatch(/HTTP requests/)
    expect(warning).toMatch(/24\.0/)
  })

  it('skips warning when not Cloudflare or no active VPN speed tests', () => {
    const components = [vpn({ id: '1', slug: 'a', speed_test_interval_seconds: 60, poll_interval_seconds: 60 })]
    expect(buildLocalSpeedTestWarning(components, 60, 60, false)).toBeNull()
    expect(buildLocalSpeedTestWarning([], 60, 60, true)).toBeNull()
  })
})

describe('validateSpeedTestUrlTemplate', () => {
  it('requires https and a {bytes} placeholder', () => {
    expect(validateSpeedTestUrlTemplate('')).toMatch(/required/i)
    expect(validateSpeedTestUrlTemplate('https://x.example/down')).toMatch(/\{bytes\}/)
    expect(validateSpeedTestUrlTemplate('http://x.example/down?bytes={bytes}')).toMatch(/HTTPS/)
    expect(validateSpeedTestUrlTemplate('https://x.example/down?bytes={bytes}')).toBeNull()
  })
})

describe('isVpnCheckType / usesDefaultCloudflareTemplate', () => {
  it('recognizes VPN check types', () => {
    expect(isVpnCheckType('openvpn')).toBe(true)
    expect(isVpnCheckType('xray')).toBe(true)
    expect(isVpnCheckType('http_status')).toBe(false)
  })

  it('falls back to the monitoring default template', () => {
    expect(
      usesDefaultCloudflareTemplate(
        { speed_test_url_template: null },
        'https://speed.cloudflare.com/__down?bytes={bytes}',
      ),
    ).toBe(true)
    expect(
      usesDefaultCloudflareTemplate(
        { speed_test_url_template: 'https://cdn.example.com/x?b={bytes}' },
        'https://speed.cloudflare.com/__down?bytes={bytes}',
      ),
    ).toBe(false)
  })
})
