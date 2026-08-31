import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'

export interface PresentationPayload { label: string }

export function Scene({ payload }: SceneProps<PresentationPayload>) {
  return <SceneLayer><Box layoutId={entities.subject} className="__SLUG__-subject">{payload.label}</Box></SceneLayer>
}
