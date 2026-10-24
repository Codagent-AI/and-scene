import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step7: Step<SampleState> = {
  id: 'it-checks-its-own-work',
  era: 'the build',
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  groupKey: 'sample',
  payload: { upTo: 7 },
  Scene: SampleScene,
}
