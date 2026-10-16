import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step07: Step<DeckPayload> = {
  id: 'verify',
  era: 'the build',
  title: "It checks its own work",
  caption: "Before saying done, it builds and renders every step — and fixes what breaks.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 7 },
}
