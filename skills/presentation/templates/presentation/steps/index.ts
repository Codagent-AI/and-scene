import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import type { SceneState } from './Scene'

/** Replace these starter beats with the presentation's real steps. Numbering follows array order. */
export const STEPS: readonly Step<SceneState>[] = [
  {
    id: 'opening',
    era: 'start',
    title: '{{TITLE}}',
    caption: 'Replace this caption with the first beat of the story.',
    groupKey: '{{SLUG}}',
    Scene,
    payload: { step: 1 },
  },
  {
    id: 'detail',
    era: 'start',
    title: 'A second beat',
    caption: 'The subject moves aside and a detail arrives.',
    groupKey: '{{SLUG}}',
    Scene,
    payload: { step: 2 },
  },
]
