import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

export const step8: Step<SamplePayload> = {
  id: 'loop',
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { n: 8 },
}
