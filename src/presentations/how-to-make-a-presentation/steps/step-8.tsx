import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step8: Step<SamplePayload> = {
  id: 'step-8',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 8 },
}
