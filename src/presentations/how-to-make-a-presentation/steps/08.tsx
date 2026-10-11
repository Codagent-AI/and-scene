import type { Step } from '../../../presentation-kit'
import { Scene, type Payload } from '../Scene'

export const step08: Step<Payload> = {
  id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.',
  caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  diagram: { scene: Scene, groupKey: 'how-to-make-a-presentation', payload: { beat: 8 } },
}
