import { diagramState, type DiagramState } from '../entities'
import { Diagram } from '../scene'
import type { Step } from '../../../presentation-kit'

export const step: Step<DiagramState> = {
  id: 'the-skill-interviews-you',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  Scene: Diagram,
  payload: diagramState(
    ['you', 'prompt', 'skill', 'question', 'talk-link'],
    ['skill', 'question', 'talk-link'],
  ),
}

export default step
