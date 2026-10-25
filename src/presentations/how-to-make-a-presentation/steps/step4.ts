import type { Step } from '../../../presentation-kit/index.ts'
import type { SampleState } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import { PAYLOADS } from './data.ts'

export const step4: Step<SampleState> = {
  id: "the-deck-grows",
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: SampleScene,
  groupKey: 'sample',
  payload: PAYLOADS[3],
}
