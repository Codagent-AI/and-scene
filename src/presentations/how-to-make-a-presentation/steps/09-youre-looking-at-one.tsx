import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step9: Step<TalkPayload> = {
  id: 'reveal',
  era: 'the reveal',
  title: 'You\'re looking at one',
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 9 },
}
