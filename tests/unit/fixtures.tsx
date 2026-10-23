import type { Step, SceneProps } from '../../src/presentation-kit/index.ts'

export interface P {
  n: number
}

export const mounts = { count: 0, unmounts: 0 }

import { useEffect } from 'react'

export function CountingScene({ payload }: SceneProps<P>) {
  useEffect(() => {
    mounts.count++
    return () => {
      mounts.unmounts++
    }
  }, [])
  return <div data-testid="scene">payload {payload.n}</div>
}

export function OtherScene({ payload }: SceneProps<P>) {
  return <div data-testid="other-scene">other {payload.n}</div>
}

export const ERAS = ['alpha', 'alpha', 'beta', 'beta', 'beta', 'gamma']

/** Six steps across three eras, all in one group. */
export function makeSteps(count = 6): Step<P>[] {
  return Array.from({ length: count }, (_, n) => ({
    id: `s${n}`,
    era: ERAS[n] ?? 'omega',
    title: `Title ${n}`,
    caption: `Caption ${n} `.repeat(6).trim(),
    Scene: CountingScene,
    payload: { n },
    groupKey: 'g',
  }))
}

export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
