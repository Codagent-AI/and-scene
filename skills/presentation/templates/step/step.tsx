import type { Step, SceneProps } from '../../../presentation-kit'
import { SceneLayer } from '../../../presentation-kit'

export type StepPayload = { /* describe the entities in this state */ }

export function Scene({}: SceneProps<StepPayload>) {
  return <SceneLayer>{/* compose kit primitives or raw motion elements here */}</SceneLayer>
}

export const step: Step<StepPayload> = {
  id: 'step-id',
  era: 'Section',
  title: 'Presenter title',
  caption: 'Browse caption.',
  payload: {},
  Scene,
  groupKey: 'scene-group',
}
