import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step05: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-05',
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 5 } },
}
