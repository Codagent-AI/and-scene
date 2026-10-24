import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-07',
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 7 },
})
