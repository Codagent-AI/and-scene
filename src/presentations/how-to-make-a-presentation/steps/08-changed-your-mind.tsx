import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'loop',
  era: 'the loop',
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene: Diagram,
  payload: { beat: 8 },
  groupKey: 'htp',
}
