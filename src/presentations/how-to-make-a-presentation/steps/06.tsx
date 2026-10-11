import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step06: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-06',
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 6 } },
}
