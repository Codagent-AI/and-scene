import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step8: Step<ScenePayload> = {
  id: 'changed-your-mind-loop-it',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption:
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  Scene,
  payload: { step: 8 },
  groupKey: 'evolving-scene',
}
