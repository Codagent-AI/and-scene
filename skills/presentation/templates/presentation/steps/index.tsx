import type { Step } from '../../../../presentation-kit'
import OpeningScene from './OpeningScene'

export const steps: Step[] = [
  {
    id: 'opening',
    era: 'Introduction',
    title: 'Introduce the idea',
    caption: 'State the central idea and give the audience a visual anchor.',
    Scene: OpeningScene,
  },
]
