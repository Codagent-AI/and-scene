import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
export const steps: Step<{ expanded: boolean }>[] = [
  { id: 'idea', era: 'begin', title: 'Start with an idea', caption: 'Introduce your topic here.', Scene, groupKey: 'story', payload: { expanded: false } },
  { id: 'detail', era: 'develop', title: 'Let it develop', caption: 'Explain what changes while the idea persists.', Scene, groupKey: 'story', payload: { expanded: true } },
]
