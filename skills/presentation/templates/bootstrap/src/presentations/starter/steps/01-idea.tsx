import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'idea',
  era: 'start',
  title: 'Start with an idea',
  caption: 'Every presentation begins with one idea.',
  Scene: Diagram,
  payload: { step: 1 },
  groupKey: 'starter',
}
