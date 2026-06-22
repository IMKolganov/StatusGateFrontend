export function formatSpeedTestError(raw: string | null | undefined): string {
  const text = raw?.trim()
  if (!text) return 'Speed test failed'

  const httpMatch = text.match(/Client error '(\d{3})/)
  if (httpMatch) {
    const code = httpMatch[1]
    if (code === '429') return 'Speed test rate limited (HTTP 429)'
    if (code === '403') return 'Speed test blocked (HTTP 403)'
    return `Speed test failed (HTTP ${code})`
  }

  if (/\btimeout\b/i.test(text)) return 'Speed test timed out'

  if (text.startsWith('Speed test ')) return text

  return 'Speed test failed'
}
