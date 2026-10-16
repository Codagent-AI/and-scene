import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "you-set-the-depth",
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 5 },
})
