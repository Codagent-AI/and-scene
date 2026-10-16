import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from './Scene'
import { STEP_META } from './meta'

export const STEPS: readonly Step<Payload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  Scene,
  groupKey: 'scene',
  payload: { n: i + 1 },
}))
