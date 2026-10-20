import type { StepMeta } from '../../../presentation-kit/types.ts'

/** Step narration. Numbers are derived from position; ids stay stable when steps move. */
export const STEP_META: readonly StepMeta[] = [
  { id: 'start', era: 'start', title: 'Where it begins', caption: 'Replace this with the first beat of the story.' },
  { id: 'grow', era: 'start', title: 'Where it grows', caption: 'Replace this with the second beat of the story.' },
]
