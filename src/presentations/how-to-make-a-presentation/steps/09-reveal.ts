import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "reveal",
  era: "the reveal",
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 9 },
}
