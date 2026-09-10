import type { SceneProps, Step } from '../../../presentation-kit'
import type { PresentationPayload } from './index'

function StepScene({ payload }: SceneProps<PresentationPayload>) {
  return <div>{payload.label}</div>
}

export const {{STEP_EXPORT}}: Step<PresentationPayload> = {
  id: '{{STEP_ID}}',
  era: '{{ERA}}',
  title: '{{TITLE}}',
  caption: '{{CAPTION}}',
  payload: { label: '{{LABEL}}' },
  Scene: StepScene,
}
