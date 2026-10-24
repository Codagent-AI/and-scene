import { defineStep } from '../../../presentation-kit'
import { Scene } from '../Scene'

export default defineStep({
  id: 'step-02',
  era: 'beginning',
  title: 'Step 2 title',
  caption: 'Step 2 caption: one or two sentences for browse mode.',
  groupKey: 'main',
  Scene,
  payload: { beat: 2 },
})
