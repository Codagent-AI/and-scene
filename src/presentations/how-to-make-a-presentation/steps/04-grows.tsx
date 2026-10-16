import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  scene: Scene,
  payload: { beat: 4 },
  groupKey: 'story',
}
