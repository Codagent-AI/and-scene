import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "checks-its-own-work",
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step \u2014 and fixes what breaks.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 7 },
})
