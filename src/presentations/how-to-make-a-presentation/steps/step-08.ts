import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-08',
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 8 },
})
