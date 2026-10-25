import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step1: Step<SampleState> = {
  id: "you-have-a-topic",
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[0],
}
