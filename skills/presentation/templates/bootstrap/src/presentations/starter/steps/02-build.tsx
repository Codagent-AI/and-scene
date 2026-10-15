import type { Step } from '../../../presentation-kit'
import { Diagram, type DiagramPayload } from '../Diagram'

export const step: Step<DiagramPayload> = {
  id: 'build',
  era: 'start',
  title: 'Build it',
  caption: 'The idea grows into something you build.',
  Scene: Diagram,
  payload: { step: 2 },
  groupKey: 'starter',
}
