import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step8 } from './step-8.tsx'

export const step9: Step<SamplePayload> = {
  id: 'reveal',
  groupKey: 'sample',
  era: 'the reveal',
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: SampleScene,
  payload: { visible: [...step8.payload.visible, 'frame'] },
}
