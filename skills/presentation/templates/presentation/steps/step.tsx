// One step: a title, a caption, and the diagram state shown while it is active.
import type { Step } from '../../../presentation-kit'
import type { DiagramState } from '../entities'
import { Diagram } from '../scene'

export const step: Step<DiagramState> = {
  id: 'first-step',
  era: 'the start',
  title: 'First step',
  caption: 'Replace this caption with one paragraph about the step.',
  Scene: Diagram,
  payload: { visible: ['example-box'], added: ['example-box'], emphasized: [] },
}

export default step
