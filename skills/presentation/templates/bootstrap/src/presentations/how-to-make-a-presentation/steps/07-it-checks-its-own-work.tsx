import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'it-checks-its-own-work',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  Scene: Diagram,
  payload: diagramState([
      'you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link',
      'ghost', 'depth-control', 'socket', 'verify', 'chain-link', 'pass-check',
    ]),
}

export default step
