import type { Step } from '../../../presentation-kit/types'
import { ExampleScene } from './ExampleScene'
interface Payload { label: string }
export const steps: Step<Payload>[] = [
  // Replace this starter state with the presentation's named narrative beats.
  { id: 'step-1', era: 'Beginning', title: 'Replace this title', caption: 'Replace this caption with the spoken explanation.', payload: { label: 'Your topic' }, Scene: ExampleScene, groupKey: 'main-scene' },
]
