import { act } from '@testing-library/react'
import type { Step } from '../types.ts'
import { TestScene } from './TestScene.tsx'
import type { TestPayload } from './testTypes.ts'

const ERAS = ['alpha', 'alpha', 'beta', 'beta', 'beta', 'gamma']

export function makeSteps(count = 6, eras: readonly string[] = ERAS): Step<TestPayload>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `step-${i}`,
    era: eras[i % eras.length],
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    Scene: TestScene,
    groupKey: 'g',
    payload: { label: `payload ${i}` },
  }))
}

export function setViewport(width: number, height: number) {
  act(() => {
    Object.assign(window, { innerWidth: width, innerHeight: height })
    window.dispatchEvent(new Event('resize'))
  })
}

export function key(name: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

export function touch(type: 'touchstart' | 'touchend', x: number, y: number) {
  const event = new Event(type, { bubbles: true })
  Object.assign(event, { changedTouches: [{ clientX: x, clientY: y }] })
  act(() => {
    window.dispatchEvent(event)
  })
}

export function swipe(dx: number, dy = 0) {
  touch('touchstart', 200, 200)
  touch('touchend', 200 + dx, 200 + dy)
}
