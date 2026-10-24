import type { Step } from '../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene'
import { STEP_META } from './meta'

export const STEPS: Step<SamplePayload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  Scene: SampleScene,
  payload: { step: i + 1 },
  groupKey: 'sample',
}))
