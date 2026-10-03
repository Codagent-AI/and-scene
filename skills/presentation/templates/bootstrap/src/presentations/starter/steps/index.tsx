import type { Step } from '../../../presentation-kit'
import { Opening } from './Opening'
import type { Payload } from './Opening'

export const steps: Step<Payload>[] = [
  { id: 'opening', era: 'opening', title: 'A first scene', caption: 'Replace this starter with your evolving scene.', Scene: Opening, payload: { label: 'Your topic begins here' } },
]
