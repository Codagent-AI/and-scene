import type { Step } from '../../../presentation-kit/index.ts'
import type { ScenePayload } from '../entities.ts'
import { Scene } from '../Scene.tsx'
import { step1 } from './step-1.tsx'

export const step2: Step<ScenePayload> = {
  id: 'idea',
  groupKey: '{{SLUG}}',
  era: 'the start',
  title: 'The idea connects',
  caption: 'Later steps add to the same scene instead of redrawing it.',
  Scene,
  payload: { visible: [...step1.payload.visible, 'link', 'idea'] },
}
