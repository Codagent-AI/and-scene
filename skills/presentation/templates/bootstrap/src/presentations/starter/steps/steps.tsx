import type { Step } from '../../../presentation-kit/types'
import { StarterScene } from './StarterScene'
interface Payload { label: string }
export const steps: Step<Payload>[] = [
  { id: 'starter-intro', era: 'Start', title: 'Your presentation starts here', caption: 'Replace this sample with the first state of your evolving scene.', payload: { label: 'Your topic' }, Scene: StarterScene, groupKey: 'starter-scene' },
]
