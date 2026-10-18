import type { SampleStep } from '../types'
import { Scene } from '../Scene'

export const step8: SampleStep = {
  id: 'step-8',
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene,
  groupKey: 'sample',
  payload: { step: 8 },
}
