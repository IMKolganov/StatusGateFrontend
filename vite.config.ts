import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

/** Bake brand into <title> so the tab never flashes the Vite scaffold name. */
function htmlBrandTitle(): Plugin {
  return {
    name: 'html-brand-title',
    transformIndexHtml(html, ctx) {
      const mode = ctx.server?.config.mode ?? 'production'
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      const name = env.VITE_BRAND_NAME?.trim() || process.env.VITE_BRAND_NAME?.trim() || 'StatusGate'
      return html.replace(/<title>.*?<\/title>/i, `<title>${name}</title>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlBrandTitle()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
