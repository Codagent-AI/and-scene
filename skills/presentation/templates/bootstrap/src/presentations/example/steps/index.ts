import type { Step } from '../../../presentation-kit'
import { STEP_META } from '../meta'
import { MainScene, type MainPayload } from './MainScene'

/** Steps sharing a groupKey keep one mounted Scene, so entities morph in place between them. */
export const STEPS: readonly Step<MainPayload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  Scene: MainScene,
  groupKey: 'scene',
  payload: { beat: i + 1 },
}))
