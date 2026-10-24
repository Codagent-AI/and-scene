import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step3: Step<SampleState> = {
  id: 'answers-become-steps',
  era: 'the gathering',
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  groupKey: 'sample',
  payload: { upTo: 3 },
  Scene: SampleScene,
}
