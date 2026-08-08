import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicTunnelMetricPoint, PublicTunnelPingSample } from '../../api/tunnelMetrics'
import { TunnelDiagnosticsCharts } from './TunnelDiagnosticsCharts'

type MockChart = {
  opts: {
    plugins?: unknown[]
    series: { label?: string }[]
    cursor?: { sync?: { key?: string } }
  }
  data: unknown
  setData: ReturnType<typeof vi.fn>
  setSize: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
}

const { instances } = vi.hoisted(() => ({ instances: [] as MockChart[] }))

vi.mock('uplot', () => {
  class UplotMock {
    opts: MockChart['opts']
    data: unknown
    root: HTMLElement
    over: HTMLElement
    setData = vi.fn()
    setSize = vi.fn()
    destroy = vi.fn()

    constructor(opts: MockChart['opts'], data: unknown, el: HTMLElement) {
      this.opts = opts
      this.data = data
      this.root = document.createElement('div')
      this.root.className = 'uplot'
      this.over = document.createElement('div')
      this.root.appendChild(this.over)
      el.appendChild(this.root)
      instances.push(this)
    }
  }
  return { default: UplotMock }
})

const BASE = Date.parse('2026-08-08T10:00:00.000Z')

function point(offsetSec: number, extra: Partial<PublicTunnelMetricPoint> = {}): PublicTunnelMetricPoint {
  return {
    checked_at: new Date(BASE + offsetSec * 1000).toISOString(),
    outcome: 'up',
    gateway_ping_avg_ms: 30,
    gateway_ping_jitter_ms: 3,
    gateway_ping_loss_percent: 0,
    ...extra,
  }
}

function pingSample(
  offsetSec: number,
  target: 'gateway' | 'internet',
): PublicTunnelPingSample {
  return {
    bucket_start: new Date(BASE + offsetSec * 1000).toISOString(),
    target,
    target_host: target === 'gateway' ? '10.8.0.1' : '8.8.8.8',
    samples_sent: 55,
    samples_received: 54,
    loss_percent: 1.8,
    min_ms: 28,
    avg_ms: 33,
    max_ms: 90,
    jitter_ms: 5,
  }
}

const RANGE = {
  rangeStart: '2026-08-08T10:00:00.000Z',
  rangeEnd: '2026-08-08T12:00:00.000Z',
}

describe('TunnelDiagnosticsCharts', () => {
  beforeEach(() => {
    instances.length = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('shows an explicit empty state and creates no charts without points', () => {
    render(<TunnelDiagnosticsCharts points={[]} events={[]} {...RANGE} />)
    expect(screen.getByText(/No data in this window/i)).toBeInTheDocument()
    expect(instances).toHaveLength(0)
  })

  it('creates ping, loss and throughput charts with synced cursors and overlay plugins', () => {
    render(
      <TunnelDiagnosticsCharts
        points={[
          point(0, { download_mbps: 110.5, download_cached: false }),
          point(60, { outcome: 'down', gateway_ping_avg_ms: null }),
          point(120),
        ]}
        events={[
          { occurred_at: new Date(BASE + 55_000).toISOString(), event_type: 'tunnel_down', message: 'lost' },
        ]}
        {...RANGE}
      />,
    )

    expect(instances).toHaveLength(3)
    const [ping, loss, throughput] = instances
    expect(ping!.opts.series[1]?.label).toMatch(/Gateway ping/)
    expect(ping!.opts.series[2]?.label).toMatch(/Jitter/)
    expect(loss!.opts.series[1]?.label).toMatch(/Packet loss/)
    expect(throughput!.opts.series[1]?.label).toMatch(/Fresh download/)
    expect(throughput!.opts.series[2]?.label).toMatch(/Cached/)

    for (const chart of instances) {
      // overlays + tooltip plugins on every panel
      expect(chart.opts.plugins).toHaveLength(2)
      expect(chart.opts.cursor?.sync?.key).toBeTruthy()
    }
    const keys = new Set(instances.map((chart) => chart.opts.cursor?.sync?.key))
    expect(keys.size).toBe(1)
  })

  it('switches ping and loss panels to continuous series when ping samples exist', () => {
    render(
      <TunnelDiagnosticsCharts
        points={[point(0), point(60)]}
        pingSamples={[
          pingSample(0, 'gateway'),
          pingSample(0, 'internet'),
          pingSample(60, 'gateway'),
        ]}
        events={[]}
        {...RANGE}
      />,
    )

    expect(screen.getByText(/In-tunnel ping \(continuous\)/i)).toBeInTheDocument()
    expect(instances).toHaveLength(2)
    const [ping, loss] = instances
    expect(ping!.opts.series[1]?.label).toMatch(/Gateway avg/)
    expect(ping!.opts.series[2]?.label).toMatch(/Internet 8\.8\.8\.8/)
    expect(ping!.opts.series[3]?.label).toMatch(/Gateway worst/)
    expect(ping!.opts.series[4]?.label).toMatch(/Internet worst/)
    expect(loss!.opts.series[1]?.label).toMatch(/Gateway loss/)
    expect(loss!.opts.series[2]?.label).toMatch(/Internet loss/)
  })

  it('renders continuous charts even when there are no check points yet', () => {
    render(
      <TunnelDiagnosticsCharts
        points={[]}
        pingSamples={[pingSample(0, 'gateway'), pingSample(60, 'gateway')]}
        events={[]}
        {...RANGE}
      />,
    )
    expect(screen.queryByText(/No data in this window/i)).not.toBeInTheDocument()
    expect(instances.length).toBeGreaterThanOrEqual(2)
  })

  it('explains a window without any speed tests instead of drawing an empty chart', () => {
    render(<TunnelDiagnosticsCharts points={[point(0), point(60)]} events={[]} {...RANGE} />)
    expect(screen.getByText(/Throughput was not measured in this window/i)).toBeInTheDocument()
    // only ping + loss charts
    expect(instances).toHaveLength(2)
  })

  it('flags cached-only throughput windows', () => {
    render(
      <TunnelDiagnosticsCharts
        points={[point(0, { download_mbps: 91.2, download_cached: true })]}
        events={[]}
        {...RANGE}
      />,
    )
    expect(screen.getByText(/only cached values are shown/i)).toBeInTheDocument()
    expect(instances).toHaveLength(3)
  })

  it('pushes new samples via setData instead of recreating instances', () => {
    const { rerender } = render(
      <TunnelDiagnosticsCharts points={[point(0), point(60)]} events={[]} {...RANGE} />,
    )
    expect(instances).toHaveLength(2)

    rerender(
      <TunnelDiagnosticsCharts points={[point(0), point(60), point(120)]} events={[]} {...RANGE} />,
    )
    expect(instances).toHaveLength(2)
    for (const chart of instances) {
      expect(chart.setData).toHaveBeenCalled()
    }
  })

  it('destroys every uPlot instance on unmount', () => {
    const { unmount } = render(
      <TunnelDiagnosticsCharts
        points={[point(0, { download_mbps: 100, download_cached: false }), point(60)]}
        events={[]}
        {...RANGE}
      />,
    )
    expect(instances).toHaveLength(3)
    unmount()
    for (const chart of instances) {
      expect(chart.destroy).toHaveBeenCalledTimes(1)
    }
  })
})
