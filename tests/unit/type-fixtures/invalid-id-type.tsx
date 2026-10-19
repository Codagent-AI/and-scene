import type { Step } from '../../../src/presentation-kit/types'

// Intentionally invalid: id must be a string.
export const wrongType: Step = {
  id: 42,
  era: 'Intro',
  title: 'One-line title',
  caption: 'A paragraph caption.',
  payload: undefined,
  Scene: () => null,
}
