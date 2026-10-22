import { ID } from '../entities.ts'
import { SampleScene } from '../SampleScene.tsx'
import type { SamplePayload } from '../SampleScene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'
import { STEP_04 } from './04-the-deck-grows.ts'

export const STEP_05: Step<SamplePayload> = {
  id: "you-set-the-depth",
  era: "the gathering",
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: SampleScene,
  groupKey: 'how-to-scene',
  payload: { visible: [...STEP_04.payload.visible, ID.ghost, ID.link3Ghost, ID.depth] },
}
