import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step07: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-07',
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 7 } },
}
