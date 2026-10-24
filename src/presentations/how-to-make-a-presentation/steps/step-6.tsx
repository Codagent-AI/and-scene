import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step5 } from './step-5.tsx'

export const step6: Step<SamplePayload> = {
  id: 'assembly',
  groupKey: 'sample',
  era: 'the build',
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  Scene: SampleScene,
  payload: { visible: [...step5.payload.visible, 'socket', 'plug'] },
}
