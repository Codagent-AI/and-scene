import { defineStep } from '../../../presentation-kit'
import { SampleScene } from '../Scene'

export default defineStep({
  id: 'step-06',
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  groupKey: 'sample',
  Scene: SampleScene,
  payload: { beat: 6 },
})
