import type { StepMeta } from '../../../presentation-kit'

/** One entry per step, in order. Step numbers come from position, so never number them by hand. */
export const NARRATION: readonly StepMeta[] = [
  { id: 'start', era: 'beginning', title: 'Start here', caption: 'The first beat of the story.' },
  { id: 'next', era: 'beginning', title: 'Then this', caption: 'The next beat extends the same scene.' },
]
