import type { ComponentType } from 'react'
import type { Step, SceneProps } from '../presentation-kit'
import { TextScene } from './TextScene'

export interface TestPayload {
  label: string
}

export function makeSteps(
  specs: { id: string; era?: string; groupKey?: string }[],
  Scene: ComponentType<SceneProps<TestPayload>> = TextScene,
): Step<TestPayload>[] {
  return specs.map((s) => ({
    id: s.id,
    era: s.era ?? 'era',
    title: `Title ${s.id}`,
    caption: `Caption ${s.id}`,
    groupKey: s.groupKey,
    Scene,
    payload: { label: s.id },
  }))
}

export const FIVE = makeSteps([
  { id: 'a', era: 'one', groupKey: 'g' },
  { id: 'b', era: 'one', groupKey: 'g' },
  { id: 'c', era: 'two' },
  { id: 'd', era: 'two' },
  { id: 'e', era: 'three' },
])
