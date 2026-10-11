import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step09: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-09',
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 9 } },
}
