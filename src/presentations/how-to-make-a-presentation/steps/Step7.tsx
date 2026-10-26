import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step7: Step<ScenePayload> = {
  id: 'it-checks-its-own-work',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  Scene,
  payload: { step: 7 },
  groupKey: 'evolving-scene',
}
