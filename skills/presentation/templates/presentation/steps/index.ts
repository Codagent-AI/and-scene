import { defineStep } from '../../../presentation-kit'
import { Scene } from './Scene'
import { STEP_META } from './meta'

/** Steps sharing a groupKey keep one mounted scene, so the diagram evolves in place. */
export const STEPS = STEP_META.map((meta, step) =>
  defineStep({ ...meta, groupKey: 'scene', Scene, payload: { step } }),
)
