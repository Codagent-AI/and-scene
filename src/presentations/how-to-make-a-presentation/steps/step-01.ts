import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-01',
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 1 },
})
