import type { Step } from '@presentation-kit'
import { Scene } from './Scene'

type Payload = { label: string }

export const STEPS: Step<Payload>[] = [
  {
    id: 'start',
    section: 'Beginning',
    title: '{{STEP_TITLE}}',
    caption: '{{STEP_CAPTION}}',
    groupKey: '{{SLUG}}-scene',
    scene: Scene,
    payload: { label: '{{SUBJECT}}' },
  },
]
