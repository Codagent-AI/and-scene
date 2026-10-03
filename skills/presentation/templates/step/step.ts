import type { Step } from '../../../../presentation-kit'
import { StepScene, type StepPayload } from './Scene'

export const step: Step<StepPayload> = {
  id: 'step-id',
  era: 'Era',
  title: 'Step title',
  caption: 'A concise narration of what changes and why it matters.',
  payload: { label: 'Visible scene content' },
  Scene: StepScene,
}
