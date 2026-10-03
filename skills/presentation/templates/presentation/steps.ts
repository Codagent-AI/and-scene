import type { Step } from '../../presentation-kit'
import { Scene, type Payload } from './Scene'

export const STEPS: Step<Payload>[] = [
  { id: 'introduction', era: 'Start', title: 'Replace this step', caption: 'Describe the first idea and what the viewer should notice.', payload: { label: 'Your first idea' }, Scene },
]
