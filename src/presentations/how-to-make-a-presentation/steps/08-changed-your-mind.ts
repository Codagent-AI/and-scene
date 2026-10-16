import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "changed-your-mind",
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place \u2014 nothing is redrawn from scratch.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 8 },
})
