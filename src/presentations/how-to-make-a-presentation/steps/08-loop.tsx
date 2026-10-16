import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'loop',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  scene: Scene,
  payload: { beat: 8 },
  groupKey: 'story',
}
