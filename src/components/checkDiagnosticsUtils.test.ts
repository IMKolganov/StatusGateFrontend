import { describe, expect, it } from 'vitest'
import { networkSummaryFromDetails } from './checkDiagnosticsUtils'

describe('networkSummaryFromDetails', () => {
  it('maps VPN upload, WAN direct fields, and last-success metadata', () => {
    const summary = networkSummaryFromDetails({
      network: {
        ipv4_address: '10.8.0.2',
        speed_test: {
          ok: true,
          mbps: 80,
          bytes: 1000,
          duration_ms: 100,
          measured_at: '2026-08-09T12:00:00+00:00',
        },
        speed_test_upload: {
          ok: true,
          mbps: 15,
          bytes: 1000,
          duration_ms: 400,
          measured_at: '2026-08-09T12:00:01+00:00',
        },
        speed_test_stats: { min_mbps: 70, max_mbps: 90, avg_mbps: 80, sample_count: 3 },
        direct_speed_test: {
          ok: true,
          mbps: 200,
          bytes: 1000,
          duration_ms: 40,
          measured_at: '2026-08-09T11:00:00+00:00',
        },
        direct_speed_test_upload: {
          ok: true,
          mbps: 40,
          bytes: 1000,
          duration_ms: 180,
          measured_at: '2026-08-09T11:00:01+00:00',
        },
        direct_speed_test_skip_reason: 'ephemeral_openvpn_active',
      },
    })

    expect(summary).not.toBeNull()
    expect(summary?.download_mbps).toBe(80)
    expect(summary?.upload_mbps).toBe(15)
    expect(summary?.speed_test_sample_count).toBe(3)
    expect(summary?.direct_download_mbps).toBe(200)
    expect(summary?.direct_upload_mbps).toBe(40)
    expect(summary?.direct_speed_test_skip_reason).toBe('ephemeral_openvpn_active')
  })

  it('falls back to last successful upload when the live upload fails', () => {
    const summary = networkSummaryFromDetails({
      network: {
        speed_test_upload: { ok: false, error: 'timeout' },
        speed_test_upload_last_success: {
          ok: true,
          mbps: 12.5,
          bytes: 500,
          duration_ms: 300,
          measured_at: '2026-08-09T10:00:00+00:00',
        },
      },
    })

    expect(summary?.upload_mbps).toBe(12.5)
    expect(summary?.upload_speed_test_ok).toBe(true)
    expect(summary?.upload_speed_test_showing_last_success).toBe(true)
    expect(summary?.upload_speed_test_error).toBe('timeout')
  })
})
