import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'reveal',
  era: 'the reveal',
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: Diagram,
  payload: { beat: 9 },
  groupKey: 'htp',
}
