import type { Step } from '../../../presentation-kit/index.ts'
import { OUTLINE } from './outline.ts'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

/** All nine beats share one persistent scene; each step only changes the stage payload. */
export const STEPS: readonly Step<SamplePayload>[] = OUTLINE.map((meta, i) => ({
  ...meta,
  groupKey: 'how-to-make-a-presentation',
  Scene: SampleScene,
  payload: { stage: i + 1 },
}))
