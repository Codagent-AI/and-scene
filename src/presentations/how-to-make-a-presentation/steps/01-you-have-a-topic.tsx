import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'topic',
  era: 'the ask',
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene: Diagram,
  payload: { beat: 1 },
  groupKey: 'htp',
}
