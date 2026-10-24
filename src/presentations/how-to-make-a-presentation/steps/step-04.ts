import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-04',
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 4 },
})
