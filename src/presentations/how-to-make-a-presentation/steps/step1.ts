import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step1: Step<SampleState> = {
  id: 'you-have-a-topic',
  era: 'the ask',
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  groupKey: 'sample',
  payload: { upTo: 1 },
  Scene: SampleScene,
}
