import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step9: Step<SamplePayload> = {
  id: 'step-9',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 9 },
}
