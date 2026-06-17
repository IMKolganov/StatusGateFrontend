export function formatUptimePercent(value: number | null | undefined): string {
  if (value == null) {
    return 'No uptime data'
  }

  return `${value.toFixed(2)}% uptime`
}

export function averageUptimePercent(values: Array<number | null | undefined>): number | null {
  const counted = values.filter((value): value is number => value != null)
  if (counted.length === 0) {
    return null
  }

  const total = counted.reduce((sum, value) => sum + value, 0)
  return Math.round((total / counted.length) * 100) / 100
}
