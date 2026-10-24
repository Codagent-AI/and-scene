import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'

export const step1: Step<SamplePayload> = {
  id: 'ask',
  groupKey: 'sample',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene: SampleScene,
  payload: { visible: ['you', 'prompt'] },
}
