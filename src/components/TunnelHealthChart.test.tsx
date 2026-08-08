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

  it('renders outage markers when only down points exist', () => {
    const { container } = render(
      <TunnelHealthChart
        points={[
          {
            checked_at: '2026-08-08T10:20:00.000Z',
            outcome: 'down',
          },
          {
            checked_at: '2026-08-08T10:40:00.000Z',
            outcome: 'timeout',
          },
        ]}
        events={[]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(container.querySelector('svg.tunnel-chart')).toBeTruthy()
    expect(container.querySelectorAll('.tunnel-chart__outage')).toHaveLength(2)
    expect(container.querySelector('.tunnel-chart__ping')).toBeNull()
  })

  it('still renders the chart when only connection events exist', () => {
    const { container } = render(
      <TunnelHealthChart
        points={[]}
        events={[
          {
            id: '00000000-0000-4000-8000-000000000099',
            occurred_at: '2026-08-08T10:30:00.000Z',
            event_type: 'tunnel_down',
          },
        ]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(container.querySelector('svg.tunnel-chart')).toBeTruthy()
    expect(container.querySelector('.tunnel-chart__event-dot')).toBeTruthy()
    expect(container.querySelector('.tunnel-chart--empty')).toBeNull()
    expect(container.textContent).not.toMatch(/No probe samples/i)
  })

  it('breaks the ping line across outage gaps', () => {
    const { container } = render(
      <TunnelHealthChart
        points={[
          {
            checked_at: '2026-08-08T10:10:00.000Z',
            outcome: 'up',
            gateway_ping_avg_ms: 20,
          },
          {
            checked_at: '2026-08-08T10:30:00.000Z',
            outcome: 'down',
          },
          {
            checked_at: '2026-08-08T10:50:00.000Z',
            outcome: 'up',
            gateway_ping_avg_ms: 40,
          },
        ]}
        events={[]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    const path = container.querySelector('.tunnel-chart__ping')?.getAttribute('d') ?? ''
    expect(path.match(/\bM\b/g)?.length).toBe(2)
  })
})

describe('TunnelThroughputChart', () => {
  it('explains empty throughput window', async () => {
    const { TunnelThroughputChart } = await import('./TunnelThroughputChart')
    render(
      <TunnelThroughputChart
        points={[
          {
            checked_at: '2026-08-08T10:15:00.000Z',
            outcome: 'up',
            gateway_ping_avg_ms: 30,
          },
        ]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(screen.getByText(/No full download speed tests/i)).toBeInTheDocument()
  })

  it('renders live and cached throughput markers', async () => {
    const { TunnelThroughputChart } = await import('./TunnelThroughputChart')
    const { container } = render(
      <TunnelThroughputChart
        points={[
          {
            checked_at: '2026-08-08T10:15:00.000Z',
            outcome: 'up',
            download_mbps: 114.6,
            download_cached: false,
          },
          {
            checked_at: '2026-08-08T11:15:00.000Z',
            outcome: 'up',
            download_mbps: 91.2,
            download_cached: true,
          },
        ]}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )
    expect(container.querySelector('.tunnel-chart__throughput')).toBeTruthy()
    expect(container.querySelectorAll('.tunnel-chart__throughput-dot')).toHaveLength(2)
    expect(container.querySelectorAll('.tunnel-chart__throughput-dot--cached')).toHaveLength(1)
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
