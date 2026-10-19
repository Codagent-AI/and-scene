import type { Step } from '../../../presentation-kit'
import { StoryScene, type StoryPayload } from '../Scene'

export const step6: Step<StoryPayload> = {
  id: 'assembles',
  era: 'the build',
  title: 'It assembles the scene',
  caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  groupKey: 'story',
  Scene: StoryScene,
  payload: { stage: 6 },
}
