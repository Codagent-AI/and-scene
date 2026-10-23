import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'the-deck-grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  Scene: Diagram,
  payload: diagramState(
    ['you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link'],
    ['card-2', 'card-3'],
  ),
}

export default step
