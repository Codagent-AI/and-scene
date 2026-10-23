import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  Scene: Diagram,
  payload: diagramState([
      'you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link',
      'ghost', 'depth-control', 'socket', 'verify', 'chain-link', 'pass-check', 'modify-arc', 'edited-flag',
      'reveal-frame', 'reveal-label',
    ], ['card-2']),
}

export default step
