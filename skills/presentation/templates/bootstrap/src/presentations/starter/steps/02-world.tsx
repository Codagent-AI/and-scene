import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'world',
  era: 'start',
  title: 'World',
  caption: 'A second step grows the same scene instead of redrawing it.',
  scene: Scene,
  payload: { beat: 2 },
  groupKey: 'story',
}
