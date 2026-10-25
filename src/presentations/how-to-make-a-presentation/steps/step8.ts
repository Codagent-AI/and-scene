import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step8: Step<SampleState> = {
  id: "changed-your-mind",
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[7],
}
