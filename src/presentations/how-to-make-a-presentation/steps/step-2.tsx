import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step1 } from './step-1.tsx'

export const step2: Step<SamplePayload> = {
  id: 'interview',
  groupKey: 'sample',
  era: 'the ask',
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: SampleScene,
  payload: { visible: [...step1.payload.visible, 'skill', 'you-skill', 'question'] },
}
