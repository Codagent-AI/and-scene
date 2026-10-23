import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'answers-become-steps',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  Scene: Diagram,
  payload: diagramState(
    ['you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'morph-note', 'morph-link'],
    ['tray', 'card-1', 'morph-note', 'morph-link'],
  ),
}

export default step
