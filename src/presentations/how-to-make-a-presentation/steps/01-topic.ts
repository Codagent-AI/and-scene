import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "topic",
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 1 },
}
