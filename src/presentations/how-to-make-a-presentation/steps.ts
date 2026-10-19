import type { Step } from '../../presentation-kit'
import { OUTLINE } from './outline'
import { PAYLOADS, type SamplePayload } from './payload'
import { Scene } from './Scene'

/** All nine steps share one group and one Scene, so a single scene instance accumulates. */
export const STEPS: readonly Step<SamplePayload>[] = OUTLINE.map((row, i) => ({
  ...row,
  groupKey: 'scene',
  Scene,
  payload: PAYLOADS[i],
}))
