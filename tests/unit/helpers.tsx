import { act } from '@testing-library/react'
import type { ComponentType } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export function setViewport(width: number, height = 768) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

export function key(k: string, target: Element | Window = window, init: KeyboardEventInit = {}) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })
}

export function swipe(dx: number, dy = 0) {
  const touch = (x: number, y: number) => ({ clientX: x, clientY: y }) as Touch
  const fire = (type: string, x: number, y: number) =>
    act(() => {
      const e = new Event(type, { bubbles: true })
      Object.assign(e, { touches: type === 'touchend' ? [] : [touch(x, y)], changedTouches: [touch(x, y)] })
      window.dispatchEvent(e)
    })
  fire('touchstart', 300, 300)
  fire('touchend', 300 + dx, 300 + dy)
}

export const Plain: ComponentType<SceneProps<{ n: number }>> = ({ payload }) => <div data-testid="scene">scene {payload.n}</div>

export function makeSteps(n = 4, overrides: Partial<Step<{ n: number }>>[] = []): Step<{ n: number }>[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    era: i < 2 ? 'first era' : 'second era',
    title: `Title ${i}`,
    caption: `Caption ${i} is a full paragraph of text.`,
    Scene: Plain,
    groupKey: 'g',
    payload: { n: i },
    ...overrides[i],
  }))
}

export const stepIndex = (c: HTMLElement) => Number(c.querySelector('[data-step-index]')?.getAttribute('data-step-index'))
