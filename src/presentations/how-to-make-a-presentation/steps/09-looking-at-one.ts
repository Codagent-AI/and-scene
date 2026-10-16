import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "looking-at-one",
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 9 },
})
