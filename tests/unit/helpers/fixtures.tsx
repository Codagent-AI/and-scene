import type { ReactElement } from 'react'
import type { SceneProps, Step } from '../../../src/presentation-kit/index.ts'

export interface Payload {
  n: number
}

export function TextScene({ payload }: SceneProps<Payload>): ReactElement {
  return <div data-testid="scene">scene {payload.n}</div>
}

const ERAS = ['one', 'one', 'two', 'two', 'two', 'three']

export function makeSteps(count = 6, Scene = TextScene): Step<Payload>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    era: ERAS[i] ?? 'more',
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1} is a longer sentence that wraps over several lines in browse mode.`,
    Scene,
    payload: { n: i + 1 },
    groupKey: 'g',
  }))
}

export function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
