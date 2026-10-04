import type { Step } from '../../presentation-kit'
import { ExampleStep } from './steps/step-example'

export const STEPS: Step<null>[] = [
  {
    id: '{{SLUG}}:opening',
    era: '{{SECTION}}',
    title: '{{STEP_TITLE}}',
    caption: '{{STEP_CAPTION}}',
    groupKey: '{{SLUG}}:scene',
    Scene: ExampleStep,
    payload: null,
  },
]
