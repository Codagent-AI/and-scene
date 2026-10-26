import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step4: Step<ScenePayload> = {
  id: 'the-deck-grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  Scene,
  payload: { step: 4 },
  groupKey: 'evolving-scene',
}
