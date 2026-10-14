import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

// Replace the id, era, title, and caption. Add one file per step, sharing `groupKey` and `scene`.
export const step1: Step<TalkPayload> = {
  id: 'first-step',
  era: 'the start',
  title: 'First step',
  caption: 'Replace this caption with what the viewer reads in browse mode.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 1 },
}
