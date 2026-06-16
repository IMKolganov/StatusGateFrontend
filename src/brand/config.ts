export type BrandConfig = {
  name: string
  logoUrl: string
  tagline: string
}

export const brandConfig: BrandConfig = {
  name: import.meta.env.VITE_BRAND_NAME?.trim() || 'StatusGate',
  logoUrl: import.meta.env.VITE_BRAND_LOGO_URL?.trim() || '',
  tagline: import.meta.env.VITE_BRAND_TAGLINE?.trim() || 'Service status monitoring',
}
