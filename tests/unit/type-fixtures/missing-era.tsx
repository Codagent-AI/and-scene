import type { Step } from '../../../src/presentation-kit/types'

// Intentionally incomplete: the Step literal omits `era`.
export const incomplete: Step = {
  id: 'intro',
  title: 'One-line title',
  caption: 'A paragraph caption.',
  payload: undefined,
  Scene: () => null,
}
