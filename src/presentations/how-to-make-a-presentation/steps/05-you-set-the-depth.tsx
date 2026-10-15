import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'depth',
  era: 'the gathering',
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: Diagram,
  payload: { beat: 5 },
  groupKey: 'htp',
}
