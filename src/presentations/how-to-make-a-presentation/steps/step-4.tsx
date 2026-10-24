import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step3 } from './step-3.tsx'

export const step4: Step<SamplePayload> = {
  id: 'deck-grows',
  groupKey: 'sample',
  era: 'the gathering',
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: SampleScene,
  payload: { visible: [...step3.payload.visible, 'card-2', 'card-3', 'card-4', 'link-2', 'link-3', 'morph-2', 'morph-3'] },
}
