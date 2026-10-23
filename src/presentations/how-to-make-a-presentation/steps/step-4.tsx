import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step4: Step<SamplePayload> = {
  id: 'step-4',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 4 },
}
