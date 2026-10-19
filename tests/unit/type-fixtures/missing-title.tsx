import type { Step } from '../../../src/presentation-kit/types'

// Intentionally incomplete: the Step literal omits `title`.
export const incomplete: Step = {
  id: 'intro',
  era: 'Intro',
  caption: 'A paragraph caption.',
  payload: undefined,
  Scene: () => null,
}
