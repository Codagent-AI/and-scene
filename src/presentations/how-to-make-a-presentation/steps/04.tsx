import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step04: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-04',
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 4 } },
}
