import type { SceneProps, Step } from '../../../presentation-kit/types.ts'
import { Box } from '../../../presentation-kit/nodes/Box.tsx'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer.tsx'
import { entities } from '../entities.ts'

export interface PresentationPayload {
  label: string
}

function FirstScene({ payload }: SceneProps<PresentationPayload>) {
  return (
    <SceneLayer>
      <Box id={entities.primary} label={payload.label} className="replace-with-presentation-entity" />
    </SceneLayer>
  )
}

export const firstStep: Step<PresentationPayload> = {
  id: 'first',
  era: 'opening',
  title: 'First step',
  caption: 'Describe the opening scene.',
  groupKey: 'main-scene',
  Scene: FirstScene,
  payload: { label: 'Opening entity' },
}
