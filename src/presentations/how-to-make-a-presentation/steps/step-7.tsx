import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step7: Step<SamplePayload> = {
  id: 'step-7',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 7 },
}
