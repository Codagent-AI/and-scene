import { act } from '@testing-library/react'

export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}
