import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step01: Step<Payload> = {
  id: 'topic', era: 'the ask', title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 1 } },
}
