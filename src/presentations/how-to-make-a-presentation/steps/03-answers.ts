import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "answers",
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 3 },
}
