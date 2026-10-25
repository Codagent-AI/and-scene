import type { Step } from '../../presentation-kit'
import { Scene } from './Scene'
export const STEPS: Step<{ label: string }>[] = [
  { id: 'start', era: 'the idea', title: 'Your opening', caption: 'Explain the opening idea in a paragraph.', groupKey: 'idea', Scene, payload: { label: 'An idea' } },
  { id: 'develop', era: 'the idea', title: 'Develop it', caption: 'Explain how the idea changes while preserving its identity.', groupKey: 'idea', Scene, payload: { label: 'The idea, developed' } },
]
