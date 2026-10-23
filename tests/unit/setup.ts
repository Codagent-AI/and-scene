import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom has no layout: give the fit-scale hook a deterministic observer and size.
class StubResizeObserver {
  callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
  }
  observe() {
    this.callback()
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver
