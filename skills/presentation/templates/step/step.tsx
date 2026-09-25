import { Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
import type { PresentationPayload } from './index'

export function {{SCENE_NAME}}({ payload }: SceneProps<PresentationPayload>) {
  return <SceneLayer className="{{CLASS_NAME}}__scene">
    <Box id={entity('{{ENTITY_NAME}}')} className="{{CLASS_NAME}}__entity">{payload.label}</Box>
  </SceneLayer>
}
