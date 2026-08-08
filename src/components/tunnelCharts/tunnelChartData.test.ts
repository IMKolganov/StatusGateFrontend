import { describe, expect, it } from 'vitest'
import type { PublicTunnelMetricPoint } from '../../api/tunnelMetrics'
import { buildEventMarkers, buildTunnelChartData, isHealthyOutcome } from './tunnelChartData'

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

describe('isHealthyOutcome', () => {
  it('treats up and degraded as healthy, everything else as outage', () => {
    expect(isHealthyOutcome('up')).toBe(true)
    expect(isHealthyOutcome('degraded')).toBe(true)
    expect(isHealthyOutcome('down')).toBe(false)
    expect(isHealthyOutcome('timeout')).toBe(false)
    expect(isHealthyOutcome('error')).toBe(false)
  })
})

describe('buildTunnelChartData', () => {
  it('returns empty aligned arrays for no points', () => {
    const data = buildTunnelChartData([])
    expect(data.ping[0]).toEqual([])
    expect(data.outages).toEqual([])
    expect(data.hasPing).toBe(false)
    expect(data.speedSampleCount).toBe(0)
  })

  it('maps ping, jitter and loss into aligned series', () => {
    const data = buildTunnelChartData([
      point(0, { gateway_ping_avg_ms: 25.5, gateway_ping_jitter_ms: 2.5, gateway_ping_loss_percent: 5 }),
      point(60),
    ])
    expect(data.ping[1]).toEqual([25.5, 30])
    expect(data.ping[2]).toEqual([2.5, 3])
    expect(data.loss[1]).toEqual([5, 0])
    expect(data.hasPing).toBe(true)
    expect(data.hasLoss).toBe(true)
  })

  it('inserts a null gap row when samples are far apart', () => {
    const data = buildTunnelChartData([point(0), point(60), point(120), point(1200)])
    // median delta = 60s, gap of 1080s > 150s threshold → one extra null row
    expect(data.ping[0]).toHaveLength(5)
    expect(data.ping[1]).toEqual([30, 30, 30, null, 30])
  })

  it('does not insert gap rows for regular intervals', () => {
    const data = buildTunnelChartData([point(0), point(60), point(120)])
    expect(data.ping[0]).toHaveLength(3)
    expect(data.ping[1]).toEqual([30, 30, 30])
  })

  it('nulls metric values on outage samples and collects outage timestamps', () => {
    const data = buildTunnelChartData([
      point(0),
      point(60, { outcome: 'down', gateway_ping_avg_ms: 12, gateway_ping_loss_percent: 100 }),
      point(120),
    ])
    expect(data.ping[1]).toEqual([30, null, 30])
    expect(data.loss[1]).toEqual([0, null, 0])
    expect(data.outages).toEqual([Math.floor(BASE / 1000) + 60])
  })

  it('splits download samples into fresh and cached series', () => {
    const data = buildTunnelChartData([
      point(0, { download_mbps: 110.5, download_cached: false }),
      point(60, { download_mbps: 91.2, download_cached: true }),
      point(120),
    ])
    expect(data.throughput[1]).toEqual([110.5, null, null])
    expect(data.throughput[2]).toEqual([null, 91.2, null])
    expect(data.speedSampleCount).toBe(2)
    expect(data.freshSpeedCount).toBe(1)
  })

  it('ignores download values on outage samples and zero mbps', () => {
    const data = buildTunnelChartData([
      point(0, { outcome: 'timeout', download_mbps: 50 }),
      point(60, { download_mbps: 0 }),
    ])
    expect(data.speedSampleCount).toBe(0)
  })

  it('sorts unordered points by time', () => {
    const data = buildTunnelChartData([point(120), point(0), point(60)])
    const xs = data.ping[0] as number[]
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
  })
})

describe('buildEventMarkers', () => {
  it('labels known event types and flags up-like events', () => {
    const markers = buildEventMarkers([
      { occurred_at: new Date(BASE + 30_000).toISOString(), event_type: 'tunnel_down', message: 'lost' },
      { occurred_at: new Date(BASE).toISOString(), event_type: 'tunnel_up', message: null },
      { occurred_at: new Date(BASE + 60_000).toISOString(), event_type: 'custom_thing' },
    ])
    expect(markers.map((m) => m.eventType)).toEqual(['tunnel_up', 'tunnel_down', 'custom_thing'])
    expect(markers[0]).toMatchObject({ up: true, label: 'Connected' })
    expect(markers[1]).toMatchObject({ up: false, label: 'Disconnected', message: 'lost' })
    expect(markers[2]).toMatchObject({ up: false, label: 'custom thing' })
  })
})
