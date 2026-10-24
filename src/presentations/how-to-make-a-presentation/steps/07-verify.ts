import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "verify",
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 7 },
}
