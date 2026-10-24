import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "depth",
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 5 },
}
