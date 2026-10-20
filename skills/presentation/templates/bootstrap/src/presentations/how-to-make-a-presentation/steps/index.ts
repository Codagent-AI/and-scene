import type { Step } from '../../../presentation-kit/types.ts'
import { SampleScene, type SamplePayload } from '../SampleScene.tsx'
import { STEP_META } from './meta.ts'

/** All nine steps share one group, so the scene persists and entities accumulate. */
export const STEPS: readonly Step<SamplePayload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
  payload: { step: i + 1 },
}))
