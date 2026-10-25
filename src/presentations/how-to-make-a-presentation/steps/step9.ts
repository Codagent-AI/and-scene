import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step9: Step<SampleState> = {
  id: "youre-looking-at-one",
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[8],
}
