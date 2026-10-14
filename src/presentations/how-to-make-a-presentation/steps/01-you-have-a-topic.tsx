import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step1: Step<TalkPayload> = {
  id: 'topic',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 1 },
}
