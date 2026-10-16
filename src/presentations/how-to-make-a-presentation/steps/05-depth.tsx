import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step05: Step<DeckPayload> = {
  id: 'depth',
  era: 'the gathering',
  title: "You set the depth",
  caption: "Spell out every step, or sketch a few and see how it looks. You hold the gate.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 5 },
}
