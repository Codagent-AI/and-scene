import type { Step } from '../../../presentation-kit/types.ts'
import { FirstStep } from './step-01.tsx'

export const STEPS: readonly Step[] = [
  { id: 'step-01', era: 'Beginning', title: 'First idea', caption: 'State the first takeaway clearly.', Scene: FirstStep, payload: undefined, groupKey: 'story' },
]
