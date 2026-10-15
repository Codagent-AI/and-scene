import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'first-step',
  era: 'Section name',
  title: 'Step title',
  caption: 'One sentence the presenter would say for this step.',
  Scene: Diagram,
  payload: { step: 1 },
  groupKey: '__SLUG__',
}
