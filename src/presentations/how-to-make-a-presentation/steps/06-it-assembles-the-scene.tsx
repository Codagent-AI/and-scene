import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'assembles',
  era: 'the build',
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  Scene: Diagram,
  payload: { beat: 6 },
  groupKey: 'htp',
}
