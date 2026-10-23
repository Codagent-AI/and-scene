import { defineStep } from '../../../presentation-kit'
import { SampleScene } from './SampleScene'
import { STEP_META } from './meta'

/** All nine steps share one scene group, so the diagram evolves in place. */
export const STEPS = STEP_META.map((meta, step) =>
  defineStep({ ...meta, groupKey: 'how-to-scene', Scene: SampleScene, payload: { step } }),
)
