import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-09',
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 9 },
})
