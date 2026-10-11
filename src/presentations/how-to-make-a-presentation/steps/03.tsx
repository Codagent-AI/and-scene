import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step03: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-03',
  era: "the gathering",
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 3 } },
}
