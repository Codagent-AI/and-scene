import type { Step } from '../../../presentation-kit/types.ts'
import { Scene, type ScenePayload } from '../Scene.tsx'
import { STEP_META } from './meta.ts'

/** Steps in one group keep a single mounted scene, so entities morph instead of remounting. */
export const STEPS: readonly Step<ScenePayload>[] = STEP_META.map((meta, i) => ({
  ...meta,
  groupKey: '__SLUG__',
  Scene,
  payload: { step: i + 1 },
}))
