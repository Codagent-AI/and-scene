import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "answers-become-steps",
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card \u2014 title, caption, visual \u2014 plus what morphs from one step into the next.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 3 },
})
