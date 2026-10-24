import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_META } from './meta.ts'
import { Scene } from './Scene.tsx'
import type { ScenePayload } from './Scene.tsx'

/** Every step shares one groupKey, so one scene instance persists across all of them. */
export const STEPS: Step<ScenePayload>[] = STEP_META.map((meta, beat) => ({
  ...meta,
  groupKey: '__SLUG__',
  payload: { beat },
  Scene,
}))
