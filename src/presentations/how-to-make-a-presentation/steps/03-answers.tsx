import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'answers',
  era: 'the gathering',
  title: 'Answers become steps',
  caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  scene: Scene,
  payload: { beat: 3 },
  groupKey: 'story',
}
