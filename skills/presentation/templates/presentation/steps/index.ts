import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'

/** One entry per step. Every step needs a title (presenter line) and a caption (browse text). */
export const STEPS: Step[] = [
  {
    id: 'first-step',
    era: 'Section name',
    title: 'Step title',
    caption: 'What this step shows, in a sentence or two.',
    Scene,
    groupKey: '__SLUG__',
  },
]
