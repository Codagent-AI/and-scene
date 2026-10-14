import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step2: Step<TalkPayload> = {
  id: 'interview',
  era: 'the ask',
  title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 2 },
}
