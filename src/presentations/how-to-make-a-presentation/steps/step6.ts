import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step6: Step<SampleState> = {
  id: "it-assembles-the-scene",
  era: "the build",
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[5],
}
