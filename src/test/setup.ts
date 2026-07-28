import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test polyfill
  window.ResizeObserver = ResizeObserverStub
}
