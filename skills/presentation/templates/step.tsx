import type { Step } from '../../../presentation-kit'

// Copy and adapt this shape for each step. Keep ids stable for entities that persist.
export const step: Step<{ message: string }> = {
  id: 'stable-step-id',
  era: 'Section name',
  title: 'One-line presenter title',
  caption: 'A self-guided explanation of this scene state.',
  Scene: ({ payload }) => <div>{payload.message}</div>,
  payload: { message: 'Describe the diagram state.' },
}
