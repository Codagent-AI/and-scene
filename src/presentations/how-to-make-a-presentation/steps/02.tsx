import type { Step } from '../../../presentation-kit'
import { GROUP_ID } from '../entities'
import { ReferenceScene } from '../Scene'

export const step02: Step<{ step: number }> = {
  id: 'how-to-make-a-presentation-02',
  era: "the ask",
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  diagram: { scene: ReferenceScene, groupKey: GROUP_ID, payload: { step: 2 } },
}
