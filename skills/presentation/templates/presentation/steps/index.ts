import type { Step } from '../../../presentation-kit/index.ts'
import { OUTLINE } from '../outline.ts'
import { Scene, type ScenePayload } from './Scene.tsx'

/** One grouped scene: only the payload stage changes between steps. */
export const STEPS: Step<ScenePayload>[] = OUTLINE.map((o, i) => ({
  ...o,
  Scene,
  payload: { stage: i + 1 },
  groupKey: '__SLUG__',
}))
