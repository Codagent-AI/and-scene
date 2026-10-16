import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step06: Step<DeckPayload> = {
  id: 'assemble',
  era: 'the build',
  title: "It assembles the scene",
  caption: "Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 6 },
}
