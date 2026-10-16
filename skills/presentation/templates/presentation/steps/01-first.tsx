import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: '{{step-id}}',
  era: '{{era}}',
  title: '{{step title}}',
  caption: '{{step caption}}',
  scene: Scene,
  payload: { beat: 1 },
  groupKey: 'story',
}
