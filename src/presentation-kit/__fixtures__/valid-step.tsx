// Compiled by `npm run build` (tsconfig.app.json includes src) but never bundled: nothing imports it.
import type { Step } from '../types'

/** A complete ungrouped step: every required field present. */
export const completeStep: Step = {
  id: 'intro',
  era: 'Intro',
  title: 'One-line presenter title',
  caption: 'A paragraph caption shown in browse mode.',
  payload: undefined,
  Scene: () => null,
}
