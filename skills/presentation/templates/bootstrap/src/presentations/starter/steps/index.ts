import type { Step } from '../../../presentation-kit'
import { Topic } from './Topic'
import type { Payload } from './Topic'

export const steps: readonly Step<Payload>[] = [
  {
    id: 'opening',
    era: 'opening',
    title: 'Start with a topic',
    caption: 'Introduce the idea that the scene will explain.',
    Scene: Topic,
    groupKey: 'topic',
    payload: { label: 'Your topic' },
  },
  {
    id: 'develop',
    era: 'development',
    title: 'Develop the idea',
    caption: 'Update the same scene as the explanation continues.',
    Scene: Topic,
    groupKey: 'topic',
    payload: { label: 'Your evolving idea' },
  },
]
