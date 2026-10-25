import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

/** Wide viewport by default; tests override window.matchMedia to simulate a narrow one. */
export function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}
mockMatchMedia(true)

afterEach(() => {
  cleanup()
  mockMatchMedia(true)
})
