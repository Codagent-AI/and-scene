import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step5: Step<SamplePayload> = {
  id: 'step-5',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 5 },
}
