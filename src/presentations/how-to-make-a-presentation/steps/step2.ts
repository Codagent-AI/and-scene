import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step2: Step<SampleState> = {
  id: "the-skill-interviews-you",
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[1],
}
