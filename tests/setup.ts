import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(cleanup)
class Observer {
  observe() {}
  disconnect() {}
  unobserve() {}
}
globalThis.ResizeObserver = Observer
