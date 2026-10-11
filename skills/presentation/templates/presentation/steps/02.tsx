import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step02: Step<Payload> = {
  id: 'development', era: 'Development', title: 'Build on the idea',
  caption: 'Show how the next point changes or extends the same scene.',
  diagram: { scene: Scene, groupKey: 'story', payload: { message: 'The idea in context' } },
}
