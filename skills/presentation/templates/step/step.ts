import type { Step } from '../../../presentation-kit'
import StepScene from './StepScene'

export const step: Step = {
  id: 'step-id',
  era: 'Section',
  title: 'Step title',
  caption: 'Explain what changed and why this step matters.',
  Scene: StepScene,
}
