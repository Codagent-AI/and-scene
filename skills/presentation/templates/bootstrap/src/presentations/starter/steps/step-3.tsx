import type { Step } from '../../../presentation-kit/index.ts'
import { StarterScene, type StarterPayload } from '../StarterScene.tsx'

export const step3: Step<StarterPayload> = {
  id: 'step-3',
  era: 'finish',
  title: 'They connect',
  caption: 'An arrow connects the two boxes.',
  Scene: StarterScene,
  groupKey: 'starter',
  payload: { step: 3 },
}
