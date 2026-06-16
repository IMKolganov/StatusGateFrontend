/** Lowercase identifier: letters, digits, hyphens only. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function slugFromName(name: string, fallback = 'item'): string {
  return slugify(name) || fallback
}
