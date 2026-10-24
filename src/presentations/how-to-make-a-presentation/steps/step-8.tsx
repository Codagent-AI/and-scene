import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step7 } from './step-7.tsx'

export const step8: Step<SamplePayload> = {
  id: 'loop',
  groupKey: 'sample',
  era: 'the loop',
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene: SampleScene,
  payload: { visible: [...step7.payload.visible, 'route', 'modify', 'flag'] },
}
