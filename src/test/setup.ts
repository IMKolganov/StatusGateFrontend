import '@testing-library/jest-dom/vitest'

// Vite `define` constants are not injected into vitest project configs — shim them.
const globals = globalThis as Record<string, unknown>
globals.__APP_VERSION__ ??= '0.1.0'
globals.__GIT_SHA__ ??= 'test'
globals.__BUILD_DATE__ ??= '1970-01-01'
