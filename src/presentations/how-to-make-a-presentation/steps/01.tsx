import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step01: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-01',
  era: "the ask",
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 1 } },
}
