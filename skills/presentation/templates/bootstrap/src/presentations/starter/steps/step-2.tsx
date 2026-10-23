import type { Step } from '../../../presentation-kit/index.ts'
import { StarterScene, type StarterPayload } from '../StarterScene.tsx'

export const step2: Step<StarterPayload> = {
  id: 'step-2',
  era: 'start',
  title: 'A second box',
  caption: 'A second box joins without disturbing the first.',
  Scene: StarterScene,
  groupKey: 'starter',
  payload: { step: 2 },
}
