import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step3: Step<SampleState> = {
  id: "answers-become-steps",
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[2],
}
