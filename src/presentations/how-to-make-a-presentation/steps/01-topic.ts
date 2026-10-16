import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

export const step1: Step<SamplePayload> = {
  id: 'topic',
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { n: 1 },
}
