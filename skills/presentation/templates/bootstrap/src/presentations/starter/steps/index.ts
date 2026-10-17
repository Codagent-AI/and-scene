import type { Step } from '../../../presentation-kit/types.ts'
import { Scene } from './scene.tsx'

const beat = (id: string, era: string, title: string, caption: string): Step<null> => ({
  id,
  era,
  title,
  caption,
  Scene,
  payload: null,
  groupKey: 'starter',
})

export const STEPS: Step<null>[] = [
  beat('start', 'beginning', 'Start with the topic', 'The first beat introduces the topic.'),
  beat('result', 'beginning', 'See the result', 'The next beat adds an entity and connects it to what is already on screen.'),
]
