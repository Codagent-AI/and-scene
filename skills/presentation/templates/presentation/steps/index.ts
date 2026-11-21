import type { Step } from '../../../presentation-kit'
import OpeningScene from './OpeningScene'

export const steps = [
  {
    id: 'opening',
    era: 'Introduction',
    title: 'Start with the subject',
    caption: 'Introduce the subject and set up the first change in the diagram.',
    Scene: OpeningScene,
    payload: undefined,
  },
] satisfies readonly Step[]
