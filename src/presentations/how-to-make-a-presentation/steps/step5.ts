import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step5: Step<SampleState> = {
  id: "you-set-the-depth",
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[4],
}
