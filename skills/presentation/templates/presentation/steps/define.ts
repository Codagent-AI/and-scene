import type { Step, StepMeta } from '../../../presentation-kit'
import { PresentationScene, type SceneState } from '../Scene'

/** All beats share one group, so the Scene stays mounted and entities update in place. */
export function defineStep(step: number, meta: StepMeta): Step<SceneState> {
  return { ...meta, groupKey: 'main', Scene: PresentationScene, payload: { step } }
}
