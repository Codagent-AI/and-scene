import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step07: Step<Payload> = {
  id: 'verify', era: 'the build', title: 'It checks its own work',
  caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 7 } },
}
