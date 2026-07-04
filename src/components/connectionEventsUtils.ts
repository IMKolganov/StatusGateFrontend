export function eventClass(eventType: string): string {
  switch (eventType) {
    case 'tunnel_up':
    case 'available':
      return 'connection-event--ok'
    case 'tunnel_down':
    case 'connect_failed':
      return 'connection-event--down'
    case 'reconnect':
      return 'connection-event--reconnect'
    case 'unavailable':
      return 'connection-event--degraded'
    default:
      return 'connection-event--neutral'
  }
}

export function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date)
  } catch {
    return value
  }
}
