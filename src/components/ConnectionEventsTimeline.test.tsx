import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
})
