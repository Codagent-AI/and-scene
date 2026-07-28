import type { Step } from '../../../presentation-kit/types'
import { Scene, type ScenePayload } from '../Scene'

export const step6: Step<ScenePayload> = {
  id: 'it-assembles-the-scene',
  era: 'the build',
  title: 'It assembles the scene',
  caption:
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  Scene,
  payload: { step: 6 },
  groupKey: 'evolving-scene',
}
