import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-03',
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 3 },
})
