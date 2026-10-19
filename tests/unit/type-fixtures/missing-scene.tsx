import type { Step } from '../../../src/presentation-kit/types'

// Intentionally incomplete: the Step literal omits `Scene`.
export const incomplete: Step = {
  id: 'intro',
  era: 'Intro',
  title: 'One-line title',
  caption: 'A paragraph caption.',
  payload: undefined,
}
