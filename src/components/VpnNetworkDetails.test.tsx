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
    expect(screen.getByText(/Last error: Speed test failed/i)).toBeInTheDocument()
  })
})
