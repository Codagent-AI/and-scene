import type { Step, StepMeta } from '../../../presentation-kit'
import { SampleScene, type SceneState } from '../Scene'

/** All beats share one group, so the Scene stays mounted and entities update in place. */
export function defineStep(step: number, meta: StepMeta): Step<SceneState> {
  return { ...meta, groupKey: 'sample', Scene: SampleScene, payload: { step } }
}
