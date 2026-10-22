import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_08 } from './08-changed-your-mind.ts'

export const STEP_09: Step<SamplePayload> = {
  id: "youre-looking-at-one",
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_08.payload.visible, ID.frame] },
}
