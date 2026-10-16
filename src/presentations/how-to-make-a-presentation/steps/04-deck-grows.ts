import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "deck-grows",
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 4 },
})
