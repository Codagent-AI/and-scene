import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { ScenePayload } from './Scene'

/** Adjacent steps with the same `groupKey` keep one mounted scene; only `payload` changes. */
export const STEPS: Step<ScenePayload>[] = [
  {
    id: 'subject',
    era: 'the start',
    title: '__TITLE__',
    caption: 'Replace this caption with the first beat of the story.',
    Scene,
    groupKey: 'scene',
    payload: { n: 1 },
  },
  {
    id: 'detail',
    era: 'the start',
    title: 'A second beat',
    caption: 'Entities from the previous step stay put; new ones enter after they settle.',
    Scene,
    groupKey: 'scene',
    payload: { n: 2 },
  },
]
