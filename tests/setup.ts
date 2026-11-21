import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
})

vi.stubGlobal('matchMedia', (media: string) => ({
  media,
  matches: true,
  addEventListener() {},
  removeEventListener() {},
}))
