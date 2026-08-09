import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

    expect(screen.getByRole('dialog', { name: /vpn download details/i })).toBeInTheDocument()
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

  it('shows tunnel live link when gateway ping and href are present', () => {
    const { container } = render(
      <MemoryRouter>
        <VpnNetworkDetails
          summary={{
            gateway_ping_avg_ms: 34.5,
            gateway_ping_loss_percent: 0,
          }}
          tunnelHref="/projects/demo/services/helsinki/tunnel"
        />
      </MemoryRouter>,
    )
    const link = container.querySelector('a[href="/projects/demo/services/helsinki/tunnel"]')
    expect(link).toBeTruthy()
    expect(link).toHaveTextContent(/Tunnel live \(2h\)/i)
  })

  it('hides tunnel link when gateway ping is missing', () => {
    const { container } = render(
      <MemoryRouter>
        <VpnNetworkDetails
          summary={{ exit_ip: '1.2.3.4' }}
          tunnelHref="/projects/demo/services/helsinki/tunnel"
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('a[href="/projects/demo/services/helsinki/tunnel"]')).toBeNull()
  })

  it('shows VPN upload and WAN speeds', () => {
    render(
      <VpnNetworkDetails
        summary={{
          download_mbps: 80,
          speed_test_ok: true,
          upload_mbps: 15.5,
          upload_speed_test_ok: true,
          upload_speed_test_min_mbps: 10,
          upload_speed_test_avg_mbps: 14,
          upload_speed_test_max_mbps: 18,
          upload_speed_test_sample_count: 5,
          direct_download_mbps: 200,
          direct_download_bytes: 524288,
          direct_download_duration_ms: 20,
          direct_download_cached: true,
          direct_download_measured_at: '2026-08-09T12:00:00.000Z',
          direct_upload_mbps: 40,
          direct_upload_cached: true,
        }}
      />,
    )

    expect(screen.getAllByText('VPN download').length).toBeGreaterThan(0)
    expect(screen.getByText('VPN upload')).toBeInTheDocument()
    expect(screen.getByText('WAN download')).toBeInTheDocument()
    expect(screen.getByText('WAN upload')).toBeInTheDocument()
    expect(screen.getByText(/15\.50 Mbps/)).toBeInTheDocument()
    expect(screen.getByText(/200\.00 Mbps/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /15\.50 Mbps/i }))
    expect(screen.getByRole('dialog', { name: /vpn upload details/i })).toBeInTheDocument()
    expect(screen.getByText(/Min: 10\.00 Mbps/i)).toBeInTheDocument()
    expect(screen.getByText(/Average: 14\.00 Mbps \(5 samples\)/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /200\.00 Mbps \(cached\)/i }))
    expect(screen.getByRole('dialog', { name: /wan download details/i })).toBeInTheDocument()
    expect(screen.getByText(/Host WAN baseline/i)).toBeInTheDocument()
  })

  it('respects expanded prop for collapsible details', () => {
    const { rerender } = render(
      <VpnNetworkDetails
        summary={{ download_mbps: 10, speed_test_ok: true }}
        collapsible
        defaultOpen={false}
        expanded={false}
      />,
    )
    const details = document.querySelector('details.network-summary-details')
    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')

    rerender(
      <VpnNetworkDetails
        summary={{ download_mbps: 10, speed_test_ok: true }}
        collapsible
        defaultOpen={false}
        expanded
      />,
    )
    expect(document.querySelector('details.network-summary-details')).toHaveAttribute('open')
  })
})
