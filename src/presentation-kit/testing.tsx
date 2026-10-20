/* eslint-disable react-refresh/only-export-components */
import { act } from '@testing-library/react'
import type { SceneProps, Step } from './types.ts'

/** Test helpers; excluded from the distributable kit snapshot. */
export function setViewport(width: number, height: number) {
  act(() => {
    Object.assign(window, { innerWidth: width, innerHeight: height })
    window.dispatchEvent(new Event('resize'))
  })
}

export function Probe({ step }: SceneProps) {
  return <div data-testid="scene">{step.id}</div>
}

export function makeSteps(eras: string[]): Step[] {
  return eras.map((era, i) => ({
    id: `s${i}`,
    era,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    Scene: Probe,
  }))
}

export function key(code: string, init: KeyboardEventInit = {}, target: Element | Window = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: code, bubbles: true, cancelable: true, ...init }))
  })
}

export function touch(startX: number, startY: number, endX: number, endY: number) {
  const point = (x: number, y: number) => ({ clientX: x, clientY: y }) as Touch
  act(() => {
    const start = new Event('touchstart', { bubbles: true })
    Object.assign(start, { touches: [point(startX, startY)], changedTouches: [point(startX, startY)] })
    window.dispatchEvent(start)
    const end = new Event('touchend', { bubbles: true })
    Object.assign(end, { touches: [], changedTouches: [point(endX, endY)] })
    window.dispatchEvent(end)
  })
}
