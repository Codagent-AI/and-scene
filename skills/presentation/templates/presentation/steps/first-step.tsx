import { Box, SceneLayer, type SceneProps, type Step } from '../../../presentation-kit'
import { entities } from '../entities'
import type { PresentationPayload } from '.'

function FirstScene({ payload }: SceneProps<PresentationPayload>) {
  return <SceneLayer className="{{SLUG}}-scene"><Box id={entities.focus}>{payload.label}</Box></SceneLayer>
}

export const firstStep: Step<PresentationPayload> = {
  id: 'first-step',
  era: 'Introduction',
  title: '{{FIRST_STEP_TITLE}}',
  caption: '{{FIRST_STEP_CAPTION}}',
  payload: { label: '{{FIRST_STEP_LABEL}}' },
  Scene: FirstScene,
}
