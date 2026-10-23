import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'changed-your-mind',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption:
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  Scene: Diagram,
  payload: diagramState(
    [
      'you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link',
      'ghost', 'depth-control', 'socket', 'verify', 'chain-link', 'pass-check', 'modify-arc', 'edited-flag',
    ],
    ['modify-arc', 'edited-flag'],
    ['card-2'],
  ),
}

export default step
