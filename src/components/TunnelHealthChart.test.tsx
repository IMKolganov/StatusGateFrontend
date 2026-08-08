import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TunnelHealthChart } from './TunnelHealthChart'
import { VpnNetworkDetails } from './VpnNetworkDetails'

describe('TunnelHealthChart', () => {
  it('shows empty state when there are no points', () => {
    render(
      <TunnelHealthChart
        points={[]}
        events={[]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(screen.getByText(/No probe samples/i)).toBeInTheDocument()
  })

  it('renders an svg chart when ping samples exist', () => {
    const { container } = render(
      <TunnelHealthChart
        points={[
          {
            checked_at: '2026-08-08T10:15:00.000Z',
            outcome: 'up',
            gateway_ping_avg_ms: 34.5,
            gateway_ping_loss_percent: 0,
          },
          {
            checked_at: '2026-08-08T11:15:00.000Z',
            outcome: 'up',
            gateway_ping_avg_ms: 41.2,
            gateway_ping_loss_percent: 5,
          },
        ]}
        events={[
          {
            occurred_at: '2026-08-08T10:45:00.000Z',
            event_type: 'tunnel_down',
            message: 'Disconnected',
          },
        ]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(container.querySelector('svg.tunnel-chart')).toBeTruthy()
    expect(container.querySelector('.tunnel-chart__ping')).toBeTruthy()
    expect(container.querySelector('.tunnel-chart__event-dot')).toBeTruthy()
  })
})

describe('VpnNetworkDetails tunnel link', () => {
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
})
