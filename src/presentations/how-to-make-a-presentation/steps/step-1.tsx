import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step1: Step<SamplePayload> = {
  id: 'step-1',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 1 },
}
