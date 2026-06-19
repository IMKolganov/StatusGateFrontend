export type BrandConfig = {
  /** App title, footer, About page — never empty. */
  name: string
  /** Header label; empty when VITE_BRAND_NAME is set to blank. */
  headerLabel: string
  logoUrl: string
  tagline: string
}

const rawBrandName = import.meta.env.VITE_BRAND_NAME

function resolveBrandName(): string {
  const trimmed = rawBrandName?.trim()
  if (trimmed) return trimmed
  return 'StatusGate'
}

function resolveHeaderLabel(): string {
  if (rawBrandName === undefined) return 'StatusGate'
  return rawBrandName.trim()
}

export const brandConfig: BrandConfig = {
  name: resolveBrandName(),
  headerLabel: resolveHeaderLabel(),
  logoUrl: import.meta.env.VITE_BRAND_LOGO_URL?.trim() || '',
  tagline: import.meta.env.VITE_BRAND_TAGLINE?.trim() || 'Service status monitoring',
}
