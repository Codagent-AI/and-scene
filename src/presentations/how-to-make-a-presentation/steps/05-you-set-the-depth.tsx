import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step5: Step<TalkPayload> = {
  id: 'depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 5 },
}
