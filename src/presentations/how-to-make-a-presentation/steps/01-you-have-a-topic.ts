import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "you-have-a-topic",
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 1 },
})
