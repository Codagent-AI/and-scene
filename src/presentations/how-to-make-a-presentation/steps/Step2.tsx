import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step2: Step<ScenePayload> = {
  id: 'the-skill-interviews-you',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  Scene,
  payload: { step: 2 },
  groupKey: 'evolving-scene',
}
