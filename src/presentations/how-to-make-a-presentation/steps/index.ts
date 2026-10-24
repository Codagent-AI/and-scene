import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_META } from './meta.ts'
import { SampleScene } from './Scene.tsx'
import type { SamplePayload } from './Scene.tsx'

/** Every step shares one groupKey, so a single scene instance persists across all nine. */
export const STEPS: Step<SamplePayload>[] = STEP_META.map((meta, beat) => ({
  ...meta,
  groupKey: 'htmp',
  payload: { beat },
  Scene: SampleScene,
}))
