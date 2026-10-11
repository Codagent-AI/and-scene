import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step04: Step<Payload> = {
  id: 'deck', era: 'the gathering', title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 4 } },
}
