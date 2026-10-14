import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step8: Step<TalkPayload> = {
  id: 'loop',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 8 },
}
