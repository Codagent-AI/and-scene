import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

let wideViewport = true

/** Controls the `(min-width: …)` media query result seen by the kit. */
export function setWideViewport(wide: boolean) {
  wideViewport = wide
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: wideViewport,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

afterEach(() => {
  cleanup()
  wideViewport = true
})
