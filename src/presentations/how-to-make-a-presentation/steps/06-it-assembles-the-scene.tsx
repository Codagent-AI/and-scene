import type { Step } from '../../../presentation-kit'
import { EvolvingScene, type TalkPayload } from '../Scene'

export const step6: Step<TalkPayload> = {
  id: 'assembles',
  era: 'the build',
  title: 'It assembles the scene',
  caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  groupKey: 'evolving-scene',
  scene: EvolvingScene,
  payload: { stage: 6 },
}
