import type { Step } from '../../presentation-kit'
import { StarterScene } from './StarterScene'
import type { StarterPayload } from './StarterScene'

export const STEPS: readonly Step<StarterPayload>[] = [
  {
    id: 'idea',
    era: 'start',
    title: 'Start with an idea',
    caption: 'Every presentation begins as one idea on the canvas.',
    groupKey: 'main',
    Scene: StarterScene,
    payload: { stage: 0 },
  },
  {
    id: 'result',
    era: 'start',
    title: 'Grow it step by step',
    caption: 'Later steps keep what is on screen and add to it.',
    groupKey: 'main',
    Scene: StarterScene,
    payload: { stage: 1 },
  },
]
