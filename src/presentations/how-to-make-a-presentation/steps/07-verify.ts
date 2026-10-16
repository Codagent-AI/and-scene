import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

export const step7: Step<SamplePayload> = {
  id: 'verify',
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { n: 7 },
}
