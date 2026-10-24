import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step6: Step<SampleState> = {
  id: 'it-assembles-the-scene',
  era: 'the build',
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  groupKey: 'sample',
  payload: { upTo: 6 },
  Scene: SampleScene,
}
