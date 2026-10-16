import { defineStep } from '../../../presentation-kit/index.ts'
import { HowToScene } from '../Scene.tsx'

export default defineStep({
  id: "assembles-the-scene",
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit \u2014 ready-made boxes, arrows, and motion that make entities morph.",
  Scene: HowToScene,
  groupKey: 'how-to',
  payload: { beat: 6 },
})
