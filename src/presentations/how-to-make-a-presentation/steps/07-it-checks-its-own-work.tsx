import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step7: Step<TalkPayload> = {
  id: 'checks',
  era: 'the build',
  title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 7 },
}
