import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'grows',
  era: 'the gathering',
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: Diagram,
  payload: { beat: 4 },
  groupKey: 'htp',
}
