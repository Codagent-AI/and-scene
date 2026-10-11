import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step09: Step<Payload> = {
  id: 'reveal', era: 'the reveal', title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 9 } },
}
