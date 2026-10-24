import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step9: Step<SampleState> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  groupKey: 'sample',
  payload: { upTo: 9 },
  Scene: SampleScene,
}
