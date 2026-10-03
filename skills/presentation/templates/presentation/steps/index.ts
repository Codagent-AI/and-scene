import type { Step } from '../../../presentation-kit'
import { Scene01 } from './Step01'
import { Scene02 } from './Step02'

export const STEPS: readonly Step<undefined>[] = [
  {
    id: 'first-beat',
    era: 'opening',
    title: '__TITLE__',
    caption: 'One sentence that frames the first beat.',
    Scene: Scene01,
    payload: undefined,
  },
  {
    id: 'second-beat',
    era: 'opening',
    title: 'The next beat',
    caption: 'What changed: entities already on screen stay put and newcomers appear.',
    Scene: Scene02,
    payload: undefined,
  },
]
