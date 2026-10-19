import { act, fireEvent } from '@testing-library/react'
import type { SceneProps, Step } from '../../src/presentation-kit'

export function setViewport(width: number, height: number) {
  act(() => {
    Object.assign(window, { innerWidth: width, innerHeight: height })
    window.dispatchEvent(new Event('resize'))
  })
}

export function press(key: string, init: KeyboardEventInit = {}, target: Element | Window = window) {
  return fireEvent.keyDown(target, { key, ...init })
}

export function swipe(from: [number, number], to: [number, number]) {
  fireEvent.touchStart(window, { changedTouches: [{ clientX: from[0], clientY: from[1] }] })
  fireEvent.touchEnd(window, { changedTouches: [{ clientX: to[0], clientY: to[1] }] })
}

function PlainScene({ step }: SceneProps) {
  return <div data-testid="scene">{step.id}</div>
}

/** Ungrouped steps over eras; each renders its own scene. */
export function makeSteps(eras: string[], prefix = 's'): Step[] {
  return eras.map((era, i) => ({
    id: `${prefix}${i + 1}`,
    era,
    title: `Title ${prefix}${i + 1}`,
    caption: `Caption ${prefix}${i + 1}`,
    Scene: PlainScene,
    payload: undefined,
  }))
}

export const currentIndex = (root: ParentNode = document) =>
  Number(root.querySelector('[data-step-index]')?.getAttribute('data-step-index'))
