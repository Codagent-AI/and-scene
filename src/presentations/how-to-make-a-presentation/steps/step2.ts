import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step2: Step<SampleState> = {
  id: 'the-skill-interviews-you',
  era: 'the ask',
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  groupKey: 'sample',
  payload: { upTo: 2 },
  Scene: SampleScene,
}
