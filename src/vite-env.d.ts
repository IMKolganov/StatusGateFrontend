/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string
  readonly VITE_BRAND_LOGO_URL?: string
  readonly VITE_BRAND_LOGO_URL_LIGHT?: string
  readonly VITE_BRAND_LOGO_URL_DARK?: string
  readonly VITE_BRAND_TAGLINE?: string
  readonly VITE_DEFAULT_SPEED_TEST_URL_TEMPLATE?: string
  readonly VITE_CLOUDFLARE_SPEED_TEST_ORIGIN?: string
  readonly VITE_DEFAULT_PROBE_URL?: string
  readonly VITE_INTERNET_PING_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
