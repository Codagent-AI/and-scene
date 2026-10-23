import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'you-set-the-depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  Scene: Diagram,
  payload: diagramState([
      'you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link',
      'ghost', 'depth-control',
    ]),
}

export default step
