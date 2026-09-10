import type { SceneProps, Step } from '../../../../presentation-kit/types'
import { Box } from '../../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../../presentation-kit/nodes/SceneLayer'
import { entities } from '../entities'

export interface PresentationPayload {
  label: string
}

function FirstScene({ payload }: SceneProps<PresentationPayload>) {
  return <SceneLayer><Box layoutId={entities.primary} className="replace-with-presentation-entity">{payload.label}</Box></SceneLayer>
}

export const firstStep: Step<PresentationPayload> = {
  id: 'first', era: 'opening', title: 'First step', caption: 'Describe the opening scene.',
  groupKey: 'main-scene', Scene: FirstScene, payload: { label: 'Opening entity' },
}
