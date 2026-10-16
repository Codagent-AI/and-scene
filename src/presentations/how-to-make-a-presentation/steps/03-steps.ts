import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

export const step3: Step<SamplePayload> = {
  id: 'steps',
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { n: 3 },
}
