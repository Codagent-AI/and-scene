import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Exit animations run on real timers; give them room on slow or throttled machines.
configure({ asyncUtilTimeout: 6000 })
afterEach(cleanup)

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList
}

export function setViewport(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
}
setViewport(1440, 900)
