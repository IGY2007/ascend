import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// jsdom no implementa matchMedia (lo usan motion y prefers-reduced-motion).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
