import type { Step } from '../../../presentation-kit'
import { presentAt } from '../entities'
import { DeckScene, type DeckPayload } from './Scene'

const GROUP = 'deck'

export const STEPS: Step<DeckPayload>[] = [
  {
    id: 'idea',
    era: 'start',
    title: 'Start with an idea',
    caption: 'Every presentation begins with one idea worth sharing.',
    groupKey: GROUP,
    Scene: DeckScene,
    payload: { present: presentAt(0) },
  },
  {
    id: 'picture',
    era: 'the point',
    title: 'Connect the idea to a picture',
    caption: 'A box for the idea, a box for the picture, and an arrow that carries one into the other.',
    groupKey: GROUP,
    Scene: DeckScene,
    payload: { present: presentAt(1) },
  },
]
