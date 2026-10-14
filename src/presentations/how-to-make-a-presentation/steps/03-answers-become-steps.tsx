import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step3: Step<TalkPayload> = {
  id: 'answers',
  era: 'the gathering',
  title: 'Answers become steps',
  caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 3 },
}
