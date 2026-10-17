import { useEffect, useId } from 'react'
import { defineStep } from '../steps'
import type { SceneProps, SceneStep } from '../types'

export interface LabelPayload {
  label: string
}

export const mounts = { count: 0 }

/** Scene fixture that counts how often a fresh instance is mounted. */
export function CountingScene({ payload }: SceneProps<LabelPayload>) {
  const instance = useId()
  useEffect(() => {
    mounts.count++
  }, [])
  return (
    <div data-testid="scene" data-instance={instance}>
      {payload.label}
    </div>
  )
}

export function makeSteps(
  count: number,
  options: { era?: (index: number) => string; groupKey?: string } = {},
): SceneStep[] {
  return Array.from({ length: count }, (_, index) =>
    defineStep({
      id: `s${index + 1}`,
      era: options.era ? options.era(index) : `era ${Math.floor(index / 2) + 1}`,
      title: `Title ${index + 1}`,
      caption: `Caption ${index + 1}`,
      Scene: CountingScene,
      groupKey: options.groupKey,
      payload: { label: `payload ${index + 1}` },
    }),
  )
}
