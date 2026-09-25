import type { Step } from '../../../presentation-kit'
import { FirstScene } from './step-01'

export interface PresentationPayload { label: string }

export const steps: Step<PresentationPayload>[] = [
  { id: 'opening', era: 'opening', title: '{{STEP_TITLE}}', caption: '{{STEP_CAPTION}}', Scene: FirstScene, payload: { label: '{{SCENE_LABEL}}' } },
]
