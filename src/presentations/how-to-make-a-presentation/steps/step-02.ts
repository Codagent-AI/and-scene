import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-02',
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 2 },
})
