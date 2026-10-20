import { act } from '@testing-library/react'

export function key(target: EventTarget, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

function touch(type: string, field: 'touches' | 'changedTouches', x: number, y: number) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, field, { value: [{ clientX: x, clientY: y }] })
  act(() => {
    window.dispatchEvent(event)
  })
}

/** Dispatch a complete swipe from (0,0) by (dx,dy). */
export function swipe(dx: number, dy = 0) {
  touch('touchstart', 'touches', 100, 100)
  touch('touchend', 'changedTouches', 100 + dx, 100 + dy)
}

export const touchEndOnly = (x: number, y: number) => touch('touchend', 'changedTouches', x, y)

export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}
