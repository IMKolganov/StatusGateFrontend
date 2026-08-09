import { useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import type { OverlayData } from './tunnelChartPlugins'

export type PanelLiveState = {
  overlays: OverlayData
  range: { start: number; end: number }
}

type Props = {
  /**
   * Builds the uPlot options once at mount. Must be referentially stable.
   * `getState` returns the latest overlays/range so plugins and scale ranges
   * stay current without recreating the chart instance.
   */
  makeOptions: (getState: () => PanelLiveState) => Omit<uPlot.Options, 'width' | 'height'>
  data: uPlot.AlignedData
  overlays: OverlayData
  range: { start: number; end: number }
  height: number
  ariaLabel: string
}

/**
 * Thin React lifecycle wrapper around imperative uPlot:
 * - creates the instance once per mount (recreating every poll would flicker and leak),
 * - pushes new samples via setData(),
 * - resizes via ResizeObserver + setSize(),
 * - destroy() on unmount.
 */
export function UplotPanel({ makeOptions, data, overlays, range, height, ariaLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const stateRef = useRef<PanelLiveState>({ overlays, range })
  const dataRef = useRef(data)
  const makeOptionsRef = useRef(makeOptions)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = Math.max(container.clientWidth, 320)
    const options = makeOptionsRef.current(() => stateRef.current)
    const chart = new uPlot({ ...options, width, height }, dataRef.current, container)
    chartRef.current = chart

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        const nextWidth = entries[0]?.contentRect.width
        if (nextWidth && chartRef.current) {
          chartRef.current.setSize({ width: Math.max(Math.floor(nextWidth), 320), height })
        }
      })
      observer.observe(container)
    }

    return () => {
      observer?.disconnect()
      chart.destroy()
      chartRef.current = null
    }
  }, [height])

  useEffect(() => {
    // Refresh live state before setData so the redraw picks up new overlays/range.
    stateRef.current = { overlays, range }
    dataRef.current = data
    chartRef.current?.setData(data)
  }, [data, overlays, range])

  return <div ref={containerRef} className="tunnel-uplot" role="img" aria-label={ariaLabel} />
}
