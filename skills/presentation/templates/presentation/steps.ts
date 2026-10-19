import type { Step } from '../../presentation-kit/index.ts'
import { NARRATION } from './narration.ts'
import { Scene } from './Scene.tsx'
import type { Payload } from './Scene.tsx'

// Steps sharing a groupKey and Scene keep one mounted scene, so entities morph in place.
export const STEPS: Step<Payload>[] = NARRATION.map((n, i) => ({
  ...n,
  Scene,
  groupKey: '__SLUG__',
  payload: { stage: i + 1 },
}))
