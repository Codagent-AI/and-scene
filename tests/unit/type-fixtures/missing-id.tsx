import type { Step } from '../../../src/presentation-kit/types'

// Intentionally incomplete: the Step literal omits `id`.
export const incomplete: Step = {
  era: 'Intro',
  title: 'One-line title',
  caption: 'A paragraph caption.',
  payload: undefined,
  Scene: () => null,
}
