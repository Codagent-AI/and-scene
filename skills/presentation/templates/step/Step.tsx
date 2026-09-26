// This standalone example is copied into src/presentations/<slug>/steps/.
// Its imports therefore go up three levels to src/presentation-kit.
import type { Step } from '../../../presentation-kit/index.js'
import { SceneLayer, Label } from '../../../presentation-kit/index.js'

export const step: Step = {
  id: 'step-id',
  era: 'era-name',
  title: 'Step title',
  caption: 'What this beat tells the audience.',
  scene: () => (
    <SceneLayer>
      <Label id="stable-entity-id" style={{ position: 'absolute', left: 80, top: 90 }}>Scene entity</Label>
    </SceneLayer>
  ),
  payload: undefined,
}
