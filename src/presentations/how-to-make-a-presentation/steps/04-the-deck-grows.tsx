import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step4: Step<TalkPayload> = {
  id: 'deck-grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 4 },
}
