import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

export const step: Step<SceneState> = {
  id: 'assembly',
  era: 'the build',
  title: 'It assembles the scene',
  caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  scene: Scene,
  payload: { beat: 6 },
  groupKey: 'story',
}
