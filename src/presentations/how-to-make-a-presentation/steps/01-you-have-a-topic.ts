import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'

export const STEP_01: Step<SamplePayload> = {
  id: "you-have-a-topic",
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [ID.you, ID.prompt] },
}
