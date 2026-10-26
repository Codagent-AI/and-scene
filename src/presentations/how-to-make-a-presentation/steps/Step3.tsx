import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step3: Step<ScenePayload> = {
  id: 'answers-become-steps',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  Scene,
  payload: { step: 3 },
  groupKey: 'evolving-scene',
}
