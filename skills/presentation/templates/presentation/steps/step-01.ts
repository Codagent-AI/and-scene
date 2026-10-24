import { defineStep } from '../../../presentation-kit'
import { Scene } from '../Scene'

export default defineStep({
  id: 'step-01',
  era: 'beginning',
  title: 'Step 1 title',
  caption: 'Step 1 caption: one or two sentences for browse mode.',
  groupKey: 'main',
  Scene,
  payload: { beat: 1 },
})
