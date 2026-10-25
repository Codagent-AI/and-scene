import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step7: Step<SampleState> = {
  id: "it-checks-its-own-work",
  era: "the build",
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[6],
}
