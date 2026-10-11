import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step08: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-08',
  era: "the loop",
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 8 } },
}
