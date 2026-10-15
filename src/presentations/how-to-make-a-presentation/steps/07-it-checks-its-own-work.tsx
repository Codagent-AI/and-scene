import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'verifies',
  era: 'the build',
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene: Diagram,
  payload: { beat: 7 },
  groupKey: 'htp',
}
