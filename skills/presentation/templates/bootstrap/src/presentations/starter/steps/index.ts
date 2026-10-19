import type { Step } from '../../../presentation-kit'
import { StarterScene } from './Scene'

export const STEPS: Step[] = [
  {
    id: 'idea',
    era: 'Starter',
    title: 'Start with an idea',
    caption: 'Every presentation starts as an idea. Replace this starter with your own topic.',
    Scene: StarterScene,
    groupKey: 'starter',
  },
  {
    id: 'scene',
    era: 'Starter',
    title: 'Shape it into a scene',
    caption: 'Entities accumulate in one evolving scene instead of being redrawn on each step.',
    Scene: StarterScene,
    groupKey: 'starter',
  },
  {
    id: 'talk',
    era: 'Starter',
    title: 'Present it',
    caption: 'Use the arrow keys to move between steps and P to switch between browse and present modes.',
    Scene: StarterScene,
    groupKey: 'starter',
  },
]
