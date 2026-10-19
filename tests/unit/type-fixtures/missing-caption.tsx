import type { Step } from '../../../src/presentation-kit/types'

// Intentionally incomplete: the Step literal omits `caption`.
export const incomplete: Step = {
  id: 'intro',
  era: 'Intro',
  title: 'One-line title',
  payload: undefined,
  Scene: () => null,
}
