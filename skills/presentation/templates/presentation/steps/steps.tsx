import type { Step } from '../../../presentation-kit/types'
import OpeningScene from './OpeningScene'

export const steps: Step[] = [
  {
    id: 'opening',
    era: 'Introduction',
    title: '{{OPENING_TITLE}}',
    caption: '{{OPENING_CAPTION}}',
    Scene: OpeningScene,
    payload: undefined,
  },
]
