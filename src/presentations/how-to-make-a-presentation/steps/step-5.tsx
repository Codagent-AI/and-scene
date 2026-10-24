import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step4 } from './step-4.tsx'

export const step5: Step<SamplePayload> = {
  id: 'depth',
  groupKey: 'sample',
  era: 'the gathering',
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: SampleScene,
  payload: { visible: [...step4.payload.visible, 'ghost', 'control'] },
}
