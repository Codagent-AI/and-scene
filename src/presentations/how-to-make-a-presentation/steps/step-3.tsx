import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step3: Step<SamplePayload> = {
  id: 'step-3',
  era: 'the gathering',
  title: 'Answers become steps',
  caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 3 },
}
