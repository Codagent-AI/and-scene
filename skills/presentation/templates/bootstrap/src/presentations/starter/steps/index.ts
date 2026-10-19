import type { Step } from '../../../presentation-kit'
import { presentAt } from '../entities'
import { StarterScene, type StarterPayload } from './Scene'

const GROUP = 'starter'

export const STEPS: Step<StarterPayload>[] = [
  {
    id: 'idea',
    era: 'start',
    title: 'Start with an idea',
    caption: 'Every presentation begins with one idea worth sharing.',
    groupKey: GROUP,
    Scene: StarterScene,
    payload: { present: presentAt(0) },
  },
  {
    id: 'picture',
    era: 'the point',
    title: 'Connect the idea to a picture',
    caption: 'A box for the idea, a box for the picture, and an arrow that carries one into the other.',
    groupKey: GROUP,
    Scene: StarterScene,
    payload: { present: presentAt(1) },
  },
]
