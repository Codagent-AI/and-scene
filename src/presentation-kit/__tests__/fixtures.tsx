import type { Step } from '../types'

export interface FixturePayload {
  label: string
}

let mounts = 0
export function resetMounts() {
  mounts = 0
}
export function mountCount() {
  return mounts
}

import { useEffect } from 'react'
import type { SceneProps } from '../types'

export function FixtureScene({ payload, stepIndex }: SceneProps<FixturePayload>) {
  useEffect(() => {
    mounts += 1
  }, [])
  return (
    <div data-testid="scene" data-index={stepIndex}>
      {payload.label}
    </div>
  )
}

export function OtherScene({ payload }: SceneProps<FixturePayload>) {
  return <div data-testid="other-scene">{payload.label}</div>
}

/** Builds `count` steps; eras are given per index (default one era per two steps). */
export function makeSteps(count: number, eras?: string[]): Step<FixturePayload>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `step-${i}`,
    era: eras?.[i] ?? `era-${Math.floor(i / 2)}`,
    title: `Title ${i}`,
    caption: `Caption ${i}`,
    groupKey: 'g',
    Scene: FixtureScene,
    payload: { label: `payload ${i}` },
  }))
}

export function setViewport(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  window.dispatchEvent(new Event('resize'))
}
