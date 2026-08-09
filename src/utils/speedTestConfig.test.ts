import { describe, expect, it } from 'vitest'
import type { MonitoredComponent } from '../api/client'
import {
  CLOUDFLARE_SPEED_TEST_MIN_GAP_SECONDS,
  estimateSpeedTestsPerMinute,
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

  it('still sums bounded intervals normally', () => {
    const components = [
      vpn({ id: '1', slug: 'a', speed_test_interval_seconds: 60, poll_interval_seconds: 60 }),
      vpn({ id: '2', slug: 'b', speed_test_interval_seconds: 120, poll_interval_seconds: 60 }),
    ]
    expect(estimateSpeedTestsPerMinute(components, 60, 3600)).toBeCloseTo(1 + 0.5, 6)
  })
})
