import '@testing-library/jest-dom/vitest'

// Vite `define` constants are not injected into vitest project configs — shim them.
const globals = globalThis as Record<string, unknown>
globals.__APP_VERSION__ ??= '0.3.0'

// jsdom has no Path2D; uplot builds series paths with it during draw.
if (typeof globalThis.Path2D === 'undefined') {
  class Path2DStub {
    moveTo() {}
    lineTo() {}
    rect() {}
    roundRect() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    closePath() {}
    addPath() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
  }
  globalThis.Path2D = Path2DStub
}

// jsdom has no matchMedia; uplot calls it at module import time.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })
}
