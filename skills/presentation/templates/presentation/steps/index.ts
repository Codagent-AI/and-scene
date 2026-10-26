import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { PresentationPayload } from './Scene'

export const STEPS: readonly Step<PresentationPayload>[] = [
  {
    id: '__STEP_ID__',
    era: '__ERA__',
    title: '__TITLE__',
    caption: '__CAPTION__',
    groupKey: '__SLUG__-scene',
    Scene,
    payload: { label: '__TITLE__' },
  },
]
