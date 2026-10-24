import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step5: Step<SampleState> = {
  id: 'you-set-the-depth',
  era: 'the gathering',
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  groupKey: 'sample',
  payload: { upTo: 5 },
  Scene: SampleScene,
}
