import type { Step } from '../../../presentation-kit'
import { ExampleScene } from './step-01'

export const steps: Step<void>[] = [
  { id: 'introduction', section: 'Introduction', title: 'Start with the topic', caption: 'A concise sentence that guides the viewer through this beat.', scene: ExampleScene, payload: undefined },
]
