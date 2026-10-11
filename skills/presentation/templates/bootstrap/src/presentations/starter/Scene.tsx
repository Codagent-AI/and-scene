import { Box, Label, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { entity } from './entities'

export type Payload = { label: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer id="starter-layer"><Box id={entity('topic')}><Label id={entity('label')}>{payload.label}</Label></Box></SceneLayer>
}
