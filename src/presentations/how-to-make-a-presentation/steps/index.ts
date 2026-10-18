import type { Step } from '../../../presentation-kit'
import { STEP_META } from '../meta'
import { SampleScene, type SamplePayload } from './SampleScene'

/** All nine beats share one group, so the scene stays mounted and entities morph in place. */
export const STEPS: readonly Step<SamplePayload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  Scene: SampleScene,
  groupKey: 'scene',
  payload: { beat: i + 1 },
}))
