import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'it-assembles-the-scene',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  Scene: Diagram,
  payload: diagramState(
    [
      'you', 'prompt', 'skill', 'question', 'talk-link', 'tray', 'card-1', 'card-2', 'card-3', 'morph-note', 'morph-link',
      'ghost', 'depth-control', 'socket',
    ],
    ['socket'],
  ),
}

export default step
