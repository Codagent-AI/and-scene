import type { SceneProps, Step } from '../presentation-kit'

export interface TestState {
  n: number
}

export function TestScene({ payload, step }: SceneProps<TestState>) {
  return (
    <div data-test-scene="">
      scene {payload.n} of {step.id}
    </div>
  )
}

/** Builds `count` steps; `eras[i]` names step i's era (default one era per step). */
export function makeSteps(count: number, eras: string[] = []): Step<TestState>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    era: eras[i] ?? `era ${i + 1}`,
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1}`,
    Scene: TestScene,
    payload: { n: i + 1 },
  }))
}

export function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}
