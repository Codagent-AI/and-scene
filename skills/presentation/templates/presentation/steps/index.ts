import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
export const STEPS: Step<{ label: string }>[] = [
  { id: 'begin', era: 'the idea', title: 'Start with an idea', caption: 'Replace this with your first narrative beat.', Scene, groupKey: 'idea', payload: { label: 'An idea' } },
  { id: 'develop', era: 'the idea', title: 'Develop the idea', caption: 'The same entity changes in place.', Scene, groupKey: 'idea', payload: { label: 'An idea, developed' } },
]
