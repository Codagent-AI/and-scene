import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../entities.ts'
import type { Step } from '../../../presentation-kit/index.ts'
import { step6 } from './step-6.tsx'

export const step7: Step<SamplePayload> = {
  id: 'self-check',
  groupKey: 'sample',
  era: 'the build',
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene: SampleScene,
  payload: { visible: [...step6.payload.visible, 'verify-link', 'verify', 'verify-check'] },
}
