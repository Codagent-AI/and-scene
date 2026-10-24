import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "assemble",
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 6 },
}
