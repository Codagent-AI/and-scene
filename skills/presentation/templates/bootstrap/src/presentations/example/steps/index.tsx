import type { Step } from '../../../presentation-kit'
import ExampleScene from './ExampleScene'

export const steps: Step[] = [
  { id: 'start', era: 'Start', title: 'Begin with an idea', caption: 'A presentation can develop one idea through a sequence of connected states.', Scene: ExampleScene },
  { id: 'evolve', era: 'Change', title: 'Show what changes', caption: 'Keep the entity identity stable as its role or relationship changes.', Scene: ExampleScene },
]
