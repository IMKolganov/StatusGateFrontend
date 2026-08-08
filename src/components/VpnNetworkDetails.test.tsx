import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VpnNetworkDetails } from './VpnNetworkDetails'

describe('VpnNetworkDetails', () => {
  it('opens speed details popover with last successful time', () => {
    render(
      <VpnNetworkDetails
        summary={{
          download_mbps: 91.2,
          download_bytes: 10_485_760,
          download_duration_ms: 900,
          speed_test_ok: true,
          speed_test_showing_last_success: true,
          speed_test_measured_at: '2026-07-20T01:10:00.000Z',
          speed_test_last_success_at: '2026-07-20T00:10:00.000Z',
          speed_test_error: 'Speed test failed',
        }}
      />,
    )

    const trigger = screen.getByRole('button', { name: /91\.20 Mbps \(cached\)/i })
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', { name: /speed test details/i })).toBeInTheDocument()
    expect(screen.getByText(/Last successful:/i)).toBeInTheDocument()
    expect(screen.getByText(/Last attempt:/i)).toBeInTheDocument()
    expect(screen.getByText(/Showing last successful measurement after a failed live test/i)).toBeInTheDocument()
    expect(screen.getByText(/Last error: Speed test failed/i)).toBeInTheDocument()
  })

  it('shows min average and max speed in the popover', () => {
    render(
      <VpnNetworkDetails
        summary={{
          download_mbps: 114.6,
          speed_test_ok: true,
          speed_test_min_mbps: 80.1,
          speed_test_avg_mbps: 97.4,
          speed_test_max_mbps: 135.3,
          speed_test_sample_count: 4,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /114\.60 Mbps/i }))
    expect(screen.getByText(/Min: 80\.10 Mbps/i)).toBeInTheDocument()
    expect(screen.getByText(/Average: 97\.40 Mbps \(4 samples\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Max: 135\.30 Mbps/i)).toBeInTheDocument()
  })

  it('does not treat zero mbps as a displayed success', () => {
    render(
      <VpnNetworkDetails
        summary={{
          download_mbps: 0,
          download_bytes: 1,
          download_duration_ms: 448,
          speed_test_ok: true,
          speed_test_showing_last_success: true,
          speed_test_error: 'Speed test downloaded no data',
        }}
      />,
    )

    expect(screen.getByRole('button', { name: /Could not measure speed: Speed test downloaded no data/i })).toBeInTheDocument()
  })

  it('explains deferred measurement when timestamps are missing', () => {
    render(
      <VpnNetworkDetails
        summary={{
          download_mbps: 91.88,
          download_bytes: 10_485_760,
          download_duration_ms: 913,
          speed_test_ok: true,
          speed_test_showing_last_success: true,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /91\.88 Mbps \(cached\)/i }))
    expect(screen.getByText(/Last successful: time not recorded yet/i)).toBeInTheDocument()
    expect(screen.getByText(/Live test deferred/i)).toBeInTheDocument()
  })

  it('shows deferred placeholder when no mbps are available yet', () => {
    render(
      <VpnNetworkDetails
        summary={{
          speed_test_ok: false,
          speed_test_error: 'Speed test deferred (waiting for a free slot among VPN services)',
        }}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: /Speed test deferred \(waiting for a free slot among VPN services\)/i,
      }),
    ).toBeInTheDocument()
  })
})
