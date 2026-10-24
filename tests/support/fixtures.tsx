import type { ComponentType } from 'react'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'

export interface Payload {
  n: number
}

export function TextScene({ payload, step }: SceneProps<Payload>) {
  return <div data-testid="scene">{`${step.id}:${payload.n}`}</div>
}

export function makeSteps(
  specs: { id: string; era: string }[],
  Scene: ComponentType<SceneProps<Payload>> = TextScene,
  groupKey?: string,
): Step<Payload>[] {
  return specs.map((s, i) => ({
    ...s,
    title: `Title ${s.id}`,
    caption: `Caption ${s.id}`,
    groupKey,
    Scene,
    payload: { n: i },
  }))
}

export const FIVE = makeSteps([
  { id: 'a', era: 'one' },
  { id: 'b', era: 'one' },
  { id: 'c', era: 'two' },
  { id: 'd', era: 'two' },
  { id: 'e', era: 'three' },
])

/** jsdom has no layout; make viewport measurements deterministic. */
export function mockViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => height })
}
