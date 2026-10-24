import { act } from '@testing-library/react'
import type { Step } from '../../src/presentation-kit/index.ts'
import type { SceneProps } from '../../src/presentation-kit/index.ts'

export interface Payload {
  label: string
}

export const counters = { mounts: 0, unmounts: 0 }

export function resetCounters() {
  counters.mounts = 0
  counters.unmounts = 0
}

import { useEffect } from 'react'

export function CountingScene({ payload, index }: SceneProps<Payload>) {
  useEffect(() => {
    counters.mounts++
    return () => {
      counters.unmounts++
    }
  }, [])
  return (
    <div data-testid="scene" data-index={index}>
      {payload.label}
    </div>
  )
}

export function OtherScene({ payload }: SceneProps<Payload>) {
  return <div data-testid="other-scene">{payload.label}</div>
}

export const makeSteps = (
  n: number,
  opts: { eras?: (i: number) => string; group?: (i: number) => string | undefined } = {},
): Step<Payload>[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `s-${i}`,
    era: opts.eras?.(i) ?? `era ${Math.floor(i / 2) + 1}`,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    groupKey: opts.group ? opts.group(i) : 'g',
    Scene: CountingScene,
    payload: { label: `payload ${i}` },
  }))

export function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

export const root = (c: HTMLElement = document.body) => c.querySelector('[data-presentation-root]') as HTMLElement
export const stepIndex = () => Number(root().getAttribute('data-step-index'))
export const mode = () => root().getAttribute('data-mode')

export const key = (k: string, target: Element | Window = window) => {
  act(() => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
    ;(target as EventTarget).dispatchEvent(event)
  })
}

export function swipe(dx: number, dy = 0) {
  act(() => {
    const mk = (type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true }) as Event & { changedTouches: unknown }
      event.changedTouches = [{ clientX: x, clientY: y }]
      window.dispatchEvent(event)
    }
    mk('touchstart', 300, 300)
    mk('touchend', 300 + dx, 300 + dy)
  })
}
