import type { Step } from '../../../presentation-kit/types'
import { Scene, type Payload } from './Scene'

export const STEPS: Step<Payload>[] = [
  {
    id: 'the-question',
    era: 'beginning',
    title: 'Start with the question',
    caption: 'Replace this caption with the first beat of your story.',
    groupKey: 'example',
    Scene,
    payload: { showResult: false },
  },
  {
    id: 'the-change',
    era: 'beginning',
    title: 'Show what changes',
    caption: 'Keep the topic in place while the next part of the explanation appears.',
    groupKey: 'example',
    Scene,
    payload: { showResult: true },
  },
]
