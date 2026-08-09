import { describe, expect, it, vi } from 'vitest'
import {
  baseAxes,
  fmt,
  lossFill,
  makeThroughputChartOptions,
} from './tunnelChartOptions'
import { overlaysPlugin, tooltipPlugin } from './tunnelChartPlugins'

describe('tunnelChartOptions', () => {
  it('formats values and axes', () => {
    expect(fmt(null, 1, 'ms')).toBe('—')
    expect(fmt(Number.NaN, 1, 'ms')).toBe('—')
    expect(fmt(12.34, 1, 'ms')).toBe('12.3 ms')
    expect(baseAxes('ms')).toHaveLength(2)
  })

  it('builds lossFill gradients and falls back when bbox is invalid', () => {
    const fill = lossFill('#000', '#111', '#222')
    expect(
      fill({
        bbox: { top: 0, height: 0 },
        ctx: { createLinearGradient: vi.fn() },
      } as never),
    ).toBe('#111')

    const addColorStop = vi.fn()
    const createLinearGradient = vi.fn(() => ({ addColorStop }))
    fill({
      bbox: { top: 10, height: 100 },
      ctx: { createLinearGradient },
    } as never)
    expect(createLinearGradient).toHaveBeenCalled()
    expect(addColorStop).toHaveBeenCalledTimes(3)
  })

  it('builds download and upload throughput chart options', () => {
    const getState = () => ({
      range: { start: 0, end: 100 },
      overlays: { outages: [], events: [] },
    })
    const download = makeThroughputChartOptions('sync', getState as never, 'download')
    const upload = makeThroughputChartOptions('sync', getState as never, 'upload')
    expect(download.series).toHaveLength(4)
    expect(String(upload.series?.[1]?.label)).toMatch(/upload/i)
    expect(download.plugins).toHaveLength(2)
  })
})

describe('tunnelChartPlugins', () => {
  it('draws outage bands and event markers', () => {
    const fillRect = vi.fn()
    const stroke = vi.fn()
    const fill = vi.fn()
    const beginPath = vi.fn()
    const moveTo = vi.fn()
    const lineTo = vi.fn()
    const arc = vi.fn()
    const setLineDash = vi.fn()
    const save = vi.fn()
    const restore = vi.fn()

    const plugin = overlaysPlugin(() => ({
      outages: [10, 999],
      events: [
        { x: 20, up: true, label: 'up', message: 'ok', eventType: 'tunnel_up' },
        { x: 30, up: false, label: 'down', message: null, eventType: 'tunnel_down' },
      ],
    }))

    plugin.hooks!.draw!({
      bbox: { left: 0, width: 100, top: 0, height: 50 },
      valToPos: (x: number) => x,
      ctx: {
        save,
        restore,
        fillRect,
        stroke,
        fill,
        beginPath,
        moveTo,
        lineTo,
        arc,
        setLineDash,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
      },
    } as never)

    expect(save).toHaveBeenCalled()
    expect(fillRect).toHaveBeenCalled()
    expect(arc).toHaveBeenCalled()
    expect(restore).toHaveBeenCalled()
  })

  it('renders and hides the tooltip on cursor moves', () => {
    const over = document.createElement('div')
    Object.defineProperty(over, 'clientWidth', { value: 200 })
    const plugin = tooltipPlugin(
      (_u, idx) => [{ label: 'Ping', value: `${idx}` }],
      () => ({
        outages: [],
        events: [{ x: 1, up: true, label: 'Connected', message: 'hello', eventType: 'tunnel_up' }],
      }),
    )

    const u = {
      over,
      data: [[1, 2], [3, 4]],
      cursor: { idx: 0 as number | null, left: 5 as number | null, top: 8 as number | null },
      valToPos: () => 5,
    }

    plugin.hooks!.init!(u as never)
    plugin.hooks!.setCursor!(u as never)
    const tip = over.querySelector('.tunnel-uplot-tip') as HTMLDivElement
    expect(tip.style.display).toBe('block')
    expect(tip.textContent).toMatch(/Ping/)
    expect(tip.textContent).toMatch(/Connected/)

    u.cursor.idx = null
    plugin.hooks!.setCursor!(u as never)
    expect(tip.style.display).toBe('none')

    plugin.hooks!.destroy!(u as never)
    expect(over.querySelector('.tunnel-uplot-tip')).toBeNull()
  })
})
