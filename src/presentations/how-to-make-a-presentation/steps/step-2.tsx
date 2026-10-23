import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step2: Step<SamplePayload> = {
  id: 'step-2',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 2 },
}
