import type { Step } from '../../../presentation-kit'
import { SceneLayer, Label } from '../../../presentation-kit'

export const step: Step = {
  id: 'step-id',
  era: 'era-name',
  title: 'Step title',
  caption: 'What this beat tells the audience.',
  scene: () => (
    <SceneLayer>
      <Label id="stable-entity-id" x={80} y={90}>Scene entity</Label>
    </SceneLayer>
  ),
  payload: undefined,
}
