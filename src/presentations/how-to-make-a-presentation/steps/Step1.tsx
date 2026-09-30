import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step1: Step<ScenePayload> = {
  id: 'you-have-a-topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene,
  payload: { step: 1 },
  groupKey: 'evolving-scene',
}
