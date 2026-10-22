import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_07 } from './07-it-checks-its-own-work.ts'

export const STEP_08: Step<SamplePayload> = {
  id: "changed-your-mind",
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_07.payload.visible, ID.modify, ID.edited] },
}
