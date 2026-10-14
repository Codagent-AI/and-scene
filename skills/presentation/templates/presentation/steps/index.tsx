import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
import type { DiagramState } from './Scene'

// Replace this neutral example with the captured narration and scene states.
export const STEPS: readonly Step<DiagramState>[] = [
  { id: 'idea', era: 'begin', title: 'An idea appears', caption: 'Start with one stable entity.',
    groupKey: 'diagram', Scene, payload: { x: 280, label: 'Idea' } },
  { id: 'evolve', era: 'develop', title: 'The same idea evolves', caption: 'Its identity stays stable as its position and label change.',
    groupKey: 'diagram', Scene, payload: { x: 480, label: 'Developed idea' } },
]
