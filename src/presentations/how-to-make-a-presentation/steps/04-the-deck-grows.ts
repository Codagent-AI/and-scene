import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_03 } from './03-answers-become-steps.ts'

export const STEP_04: Step<SamplePayload> = {
  id: "the-deck-grows",
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_03.payload.visible, ID.card2, ID.card3, ID.link12, ID.link23] },
}
