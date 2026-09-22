import type { Step } from '../../../presentation-kit'
import { Scene, type StepModel } from '../Scene'

const step: Step<StepModel> = {
  id: 'stable-step-id',
  era: 'Section',
  title: 'Step title',
  caption: 'A concise narration for this step.',
  Scene,
  payload: { label: 'Describe the visual state' },
  groupKey: 'persistent-scene',
}

export default step
