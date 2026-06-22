import type { ThemeMode } from './theme'

export type BrandConfig = {
  /** App title, footer, About page — never empty. */
  name: string
  /** Header label; empty when VITE_BRAND_NAME is set to blank. */
  headerLabel: string
  /** Fallback logo when theme-specific URLs are not set. */
  logoUrl: string
  logoUrlLight: string
  logoUrlDark: string
  tagline: string
}

const rawBrandName = import.meta.env.VITE_BRAND_NAME

function readEnv(value: string | undefined): string {
  return value?.trim() || ''
}

function resolveBrandName(): string {
  const trimmed = rawBrandName?.trim()
  if (trimmed) return trimmed
  return 'StatusGate'
}

function resolveHeaderLabel(): string {
  if (rawBrandName === undefined) return 'StatusGate'
  return rawBrandName.trim()
}

const logoUrlFallback = readEnv(import.meta.env.VITE_BRAND_LOGO_URL)
const logoUrlLight = readEnv(import.meta.env.VITE_BRAND_LOGO_URL_LIGHT) || logoUrlFallback
const logoUrlDark = readEnv(import.meta.env.VITE_BRAND_LOGO_URL_DARK) || logoUrlFallback

export function resolveBrandLogoUrl(theme: ThemeMode): string {
  return theme === 'dark' ? logoUrlDark : logoUrlLight
}

export function hasBrandLogo(): boolean {
  return Boolean(logoUrlLight || logoUrlDark)
}

export const brandConfig: BrandConfig = {
  name: resolveBrandName(),
  headerLabel: resolveHeaderLabel(),
  logoUrl: logoUrlFallback,
  logoUrlLight,
  logoUrlDark,
  tagline: readEnv(import.meta.env.VITE_BRAND_TAGLINE) || 'Service status monitoring',
}
