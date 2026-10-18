import type { SampleStep } from '../types'
import { Scene } from '../Scene'

export const step7: SampleStep = {
  id: 'step-7',
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene,
  groupKey: 'sample',
  payload: { step: 7 },
}
