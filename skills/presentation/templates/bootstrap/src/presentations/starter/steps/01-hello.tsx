import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'hello',
  era: 'start',
  title: 'Hello',
  caption: 'A placeholder starter step. Replace it with your own presentation.',
  scene: Scene,
  payload: { beat: 1 },
  groupKey: 'story',
}
