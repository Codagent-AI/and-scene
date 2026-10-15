import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'share',
  era: 'finish',
  title: 'Share it',
  caption: 'Then you share it with the room.',
  Scene: Diagram,
  payload: { step: 3 },
  groupKey: 'starter',
}
