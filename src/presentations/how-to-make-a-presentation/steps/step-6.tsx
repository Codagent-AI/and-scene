import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'

export const step6: Step<SamplePayload> = {
  id: 'step-6',
  era: 'the build',
  title: 'It assembles the scene',
  caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  Scene: SampleScene,
  groupKey: 'how-to',
  payload: { step: 6 },
}
