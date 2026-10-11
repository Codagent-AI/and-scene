import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step02: Step<Payload> = {
  id: 'interview', era: 'the ask', title: 'The skill interviews you',
  caption: 'One question at a time: the topic, the look, then each beat of the story.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 2 } },
}
