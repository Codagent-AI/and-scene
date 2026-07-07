import type { Step } from '../../presentation-kit'
import { ReferenceScene } from './ReferenceScene'
import { REFERENCE_STEP_OUTLINE } from './outline'

const GROUP = 'reference-demo'

export const STEPS: Step[] = REFERENCE_STEP_OUTLINE.map((step) => ({
  ...step,
  groupKey: GROUP,
  Scene: ReferenceScene,
}))
