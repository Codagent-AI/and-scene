import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step9: Step<ScenePayload> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  Scene,
  payload: { step: 9 },
  groupKey: 'evolving-scene',
}
