import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_05 } from './05-you-set-the-depth.ts'

export const STEP_06: Step<SamplePayload> = {
  id: "it-assembles-the-scene",
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_05.payload.visible, ID.kit] },
}
