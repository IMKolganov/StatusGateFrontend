import type uPlot from 'uplot'
import type { ChartEventMarker } from './tunnelChartData'

export type OverlayData = {
  outages: number[]
  events: ChartEventMarker[]
}

const OUTAGE_FILL = 'rgba(220, 38, 38, 0.16)'
const EVENT_UP_COLOR = 'rgba(22, 163, 74, 0.85)'
const EVENT_DOWN_COLOR = 'rgba(220, 38, 38, 0.85)'

/**
 * Draws vertical outage bands and connection-event lines over the plot area.
 * Reads overlay data through a getter so the chart instance never needs to be
 * recreated when a poll brings new events.
 */
export function overlaysPlugin(getOverlays: () => OverlayData): uPlot.Plugin {
  return {
    hooks: {
      draw(u: uPlot) {
        const { outages, events } = getOverlays()
        if (outages.length === 0 && events.length === 0) return

        const { ctx, bbox } = u
        const left = bbox.left
        const right = bbox.left + bbox.width
        ctx.save()

        for (const x of outages) {
          const cx = u.valToPos(x, 'x', true)
          if (cx < left || cx > right) continue
          ctx.fillStyle = OUTAGE_FILL
          ctx.fillRect(cx - 2, bbox.top, 4, bbox.height)
        }

        for (const event of events) {
          const cx = u.valToPos(event.x, 'x', true)
          if (cx < left || cx > right) continue
          const color = event.up ? EVENT_UP_COLOR : EVENT_DOWN_COLOR
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(cx, bbox.top)
          ctx.lineTo(cx, bbox.top + bbox.height)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(cx, bbox.top + 7, 4, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      },
    },
  }
}

export type TooltipRow = { label: string; value: string }

export type TooltipFormatter = (u: uPlot, idx: number) => TooltipRow[]

function formatClock(xSeconds: number): string {
  return new Date(xSeconds * 1000).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Max cursor distance (CSS px) at which a connection event is added to the tooltip. */
const EVENT_HOVER_PX = 8

/**
 * Crosshair tooltip: sample time, formatted series values, and any connection
 * event near the cursor. Works with cursor sync (each panel shows its own values).
 */
export function tooltipPlugin(
  formatRows: TooltipFormatter,
  getOverlays: () => OverlayData,
): uPlot.Plugin {
  let tip: HTMLDivElement | null = null

  const hide = () => {
    if (tip) tip.style.display = 'none'
  }

  return {
    hooks: {
      init(u: uPlot) {
        tip = document.createElement('div')
        tip.className = 'tunnel-uplot-tip'
        tip.style.display = 'none'
        u.over.appendChild(tip)
        u.over.addEventListener('mouseleave', hide)
      },
      destroy(u: uPlot) {
        u.over.removeEventListener('mouseleave', hide)
        tip?.remove()
        tip = null
      },
      setCursor(u: uPlot) {
        if (!tip) return
        const { idx, left, top } = u.cursor
        if (idx == null || left == null || top == null || left < 0) {
          hide()
          return
        }
        const xValue = u.data[0][idx]
        if (xValue == null) {
          hide()
          return
        }

        const rows: TooltipRow[] = [
          { label: '', value: formatClock(Number(xValue)) },
          ...formatRows(u, idx),
        ]

        for (const event of getOverlays().events) {
          const eventLeft = u.valToPos(event.x, 'x')
          if (Math.abs(eventLeft - left) <= EVENT_HOVER_PX) {
            rows.push({
              label: 'Event',
              value: event.message ? `${event.label} — ${event.message}` : event.label,
            })
          }
        }

        tip.replaceChildren(
          ...rows.map((row) => {
            const line = document.createElement('div')
            if (row.label) {
              const label = document.createElement('span')
              label.className = 'tunnel-uplot-tip__label'
              label.textContent = `${row.label}: `
              line.appendChild(label)
            }
            line.appendChild(document.createTextNode(row.value))
            return line
          }),
        )

        tip.style.display = 'block'
        const overWidth = u.over.clientWidth
        const tipWidth = tip.offsetWidth || 160
        const flip = left + tipWidth + 16 > overWidth
        tip.style.left = `${flip ? Math.max(0, left - tipWidth - 10) : left + 10}px`
        tip.style.top = `${Math.max(0, top - 10)}px`
      },
    },
  }
}
