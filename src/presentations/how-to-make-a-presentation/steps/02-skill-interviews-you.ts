import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "skill-interviews-you",
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 2 },
})
