import type { Step } from '../../../presentation-kit/index.ts'
import { StarterScene, type StarterPayload } from '../StarterScene.tsx'

export const step1: Step<StarterPayload> = {
  id: 'step-1',
  era: 'start',
  title: 'One box',
  caption: 'A single box starts the scene.',
  Scene: StarterScene,
  groupKey: 'starter',
  payload: { step: 1 },
}
