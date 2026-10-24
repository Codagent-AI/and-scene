import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "interview",
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 2 },
}
