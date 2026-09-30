import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step5: Step<ScenePayload> = {
  id: 'you-set-the-depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  Scene,
  payload: { step: 5 },
  groupKey: 'evolving-scene',
}
