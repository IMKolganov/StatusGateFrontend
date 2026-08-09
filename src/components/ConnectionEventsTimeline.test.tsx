import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectionEventsTimeline } from './ConnectionEventsTimeline'
import * as useConnectionEventsModule from './useConnectionEvents'
import type { ConnectionEvent } from '../api/client'

vi.mock('./useConnectionEvents')

const mockLoad = vi.fn()
const mockReset = vi.fn()

const sampleEvent: ConnectionEvent = {
  id: 'event-1',
  monitored_component_id: 'component-1',
  occurred_at: '2026-07-04T12:00:00.000Z',
  event_type: 'tunnel_up',
  event_label: 'Connected',
  outcome: 'up',
  message: 'VPN session event: tunnel_up',
  details: null,
}

describe('ConnectionEventsTimeline', () => {
  const getDetails = () => {
    const details = document.querySelector('.connection-events')
    if (!(details instanceof HTMLDetailsElement)) {
      throw new Error('Connection log details element not found')
    }
    return details
  }

  const dispatchToggle = (details: HTMLDetailsElement) => {
    details.dispatchEvent(new Event('toggle', { bubbles: true }))
  }

  const openTimeline = () => {
    const details = getDetails()
    details.open = true
    dispatchToggle(details)
  }

  const closeTimeline = () => {
    const details = getDetails()
    details.open = false
    dispatchToggle(details)
  }

  beforeEach(() => {
    mockLoad.mockReset()
    mockReset.mockReset()
    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [],
      loading: false,
      error: null,
      total: 0,
      hasMore: false,
      load: mockLoad,
      reset: mockReset,
    })
  })

  afterEach(() => cleanup())

  it('loads events when details opens', () => {
    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)

    openTimeline()

    expect(mockLoad).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Norway VPN')).toBeInTheDocument()
  })

  it('resets state when details closes', () => {
    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)

    openTimeline()
    closeTimeline()

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [],
      loading: true,
      error: null,
      total: 0,
      hasMore: false,
      load: mockLoad,
      reset: mockReset,
    })

    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)
    openTimeline()

    expect(screen.getByText('Loading connection events…')).toBeInTheDocument()
  })

  it('shows error state', () => {
    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [],
      loading: false,
      error: 'Failed to load connection events',
      total: 0,
      hasMore: false,
      load: mockLoad,
      reset: mockReset,
    })

    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)
    openTimeline()

    expect(screen.getByText('Failed to load connection events')).toBeInTheDocument()
  })

  it('renders event list', () => {
    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [sampleEvent],
      loading: false,
      error: null,
      total: 1,
      hasMore: false,
      load: mockLoad,
      reset: mockReset,
    })

    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)
    openTimeline()

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('VPN session event: tunnel_up')).toBeInTheDocument()
  })

  it('shows truncation, log tails, non-up outcomes, and copies text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [
        {
          ...sampleEvent,
          outcome: 'down',
          details: { log_tail: 'openvpn: connected' },
        },
      ],
      loading: false,
      error: null,
      total: 12,
      hasMore: true,
      load: mockLoad,
      reset: mockReset,
    })

    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)
    openTimeline()

    const panel = document.querySelector('.connection-events__panel')!
    const scoped = within(panel as HTMLElement)

    expect(scoped.getByText(/Showing latest 1 of 12 events/i)).toBeInTheDocument()
    expect(scoped.getByText('down')).toBeInTheDocument()
    expect(scoped.getByText('openvpn: connected')).toBeInTheDocument()

    fireEvent.click(scoped.getByRole('button', { name: /^Copy$/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(await scoped.findByRole('button', { name: /^Copied$/i })).toBeInTheDocument()

    fireEvent.click(scoped.getByRole('button', { name: /^Refresh$/i }))
    expect(mockLoad.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('falls back when clipboard write fails', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    })
    document.execCommand = vi.fn().mockReturnValue(false)

    vi.mocked(useConnectionEventsModule.useConnectionEvents).mockReturnValue({
      events: [sampleEvent],
      loading: false,
      error: null,
      total: 1,
      hasMore: false,
      load: mockLoad,
      reset: mockReset,
    })

    render(<ConnectionEventsTimeline componentId="component-1" componentName="Norway VPN" />)
    openTimeline()
    const panel = document.querySelector('.connection-events__panel')!
    fireEvent.click(within(panel as HTMLElement).getByRole('button', { name: /^Copy$/i }))
    expect(await within(panel as HTMLElement).findByRole('button', { name: /Copy failed/i })).toBeInTheDocument()
  })
})
