import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step03: Step<DeckPayload> = {
  id: 'answers',
  era: 'the gathering',
  title: "Answers become steps",
  caption: "Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 3 },
}
