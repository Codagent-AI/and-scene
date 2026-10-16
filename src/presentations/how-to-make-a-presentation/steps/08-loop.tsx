import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step08: Step<DeckPayload> = {
  id: 'loop',
  era: 'the loop',
  title: "Changed your mind? Loop it.",
  caption: "Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 8 },
}
