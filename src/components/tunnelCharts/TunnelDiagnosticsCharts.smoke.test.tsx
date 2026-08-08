/**
 * Smoke test with the REAL uplot library (not mocked): jsdom has no canvas 2D,
 * so we stub the context — but the stub validates createLinearGradient args,
 * which is exactly how the production "non-finite double" crash slipped past
 * the mocked tests.
 */
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { PublicTunnelMetricPoint } from '../../api/tunnelMetrics'
import { TunnelDiagnosticsCharts } from './TunnelDiagnosticsCharts'

function createCtxStub(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => undefined }
  const target: Record<string | symbol, unknown> = {
    canvas,
    measureText: () => ({ width: 12 }),
    createLinearGradient: (...args: number[]) => {
      if (args.some((value) => !Number.isFinite(value))) {
        throw new TypeError(
          "Failed to execute 'createLinearGradient': The provided double value is non-finite.",
        )
      }
      return gradient
    },
  }
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop]
      return () => undefined
    },
    set(obj, prop, value) {
      obj[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

const BASE = Date.parse('2026-08-08T10:00:00.000Z')

function point(offsetSec: number, extra: Partial<PublicTunnelMetricPoint> = {}): PublicTunnelMetricPoint {
  return {
    checked_at: new Date(BASE + offsetSec * 1000).toISOString(),
    outcome: 'up',
    gateway_ping_avg_ms: 30,
    gateway_ping_jitter_ms: 3,
    gateway_ping_loss_percent: 5,
    ...extra,
  }
}

describe('TunnelDiagnosticsCharts with real uplot', () => {
  beforeAll(() => {
    // matchMedia is stubbed in src/test/setup.ts (uplot needs it at import time).
    HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement) {
      return createCtxStub(this)
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    cleanup()
  })

  it('mounts, updates and unmounts without canvas errors', () => {
    const points = [
      point(0, { download_mbps: 110.5, download_cached: false }),
      point(60, { outcome: 'down', gateway_ping_avg_ms: null }),
      point(120, { download_mbps: 91.2, download_cached: true }),
    ]
    const events = [
      { occurred_at: new Date(BASE + 55_000).toISOString(), event_type: 'tunnel_down', message: 'lost' },
    ]

    const { rerender, unmount, container } = render(
      <TunnelDiagnosticsCharts
        points={points}
        events={events}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )

    expect(container.querySelectorAll('.uplot').length).toBeGreaterThanOrEqual(3)

    rerender(
      <TunnelDiagnosticsCharts
        points={[...points, point(180)]}
        events={events}
        rangeStart="2026-08-08T10:00:00.000Z"
        rangeEnd="2026-08-08T12:00:00.000Z"
      />,
    )

    unmount()
  })
})
