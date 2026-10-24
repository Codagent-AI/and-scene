import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step8: Step<SampleState> = {
  id: 'changed-your-mind',
  era: 'the loop',
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  groupKey: 'sample',
  payload: { upTo: 8 },
  Scene: SampleScene,
}
