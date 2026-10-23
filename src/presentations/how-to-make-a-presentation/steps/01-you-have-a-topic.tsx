import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'you-have-a-topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene: Diagram,
  payload: diagramState(['you', 'prompt']),
}

export default step
