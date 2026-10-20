import type { Step } from '../../presentation-kit/index.ts'
import { STEP_MODULES } from './modules.ts'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

/** All nine steps share one group, so a single scene instance accumulates entities. */
export const STEPS: Step<SamplePayload>[] = STEP_MODULES.map((m, i) => ({
  ...m.meta,
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
  payload: { upTo: i + 1 },
}))
