import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-05',
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 5 },
})
