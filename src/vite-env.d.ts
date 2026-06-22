/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string
  readonly VITE_BRAND_LOGO_URL?: string
  readonly VITE_BRAND_LOGO_URL_LIGHT?: string
  readonly VITE_BRAND_LOGO_URL_DARK?: string
  readonly VITE_BRAND_TAGLINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
