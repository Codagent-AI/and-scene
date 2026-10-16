import type { StepMeta } from '../../../presentation-kit'

/** One entry per step, in order. Numbers are derived from position. */
export const STEP_META: readonly StepMeta[] = [
  {
    id: 'start',
    era: 'start',
    title: 'Start with the subject',
    caption: 'Replace this caption with what the viewer should take from the first step.',
  },
  {
    id: 'grow',
    era: 'start',
    title: 'Grow the diagram',
    caption: 'Later steps add or change entities in the same scene instead of redrawing it.',
  },
]
