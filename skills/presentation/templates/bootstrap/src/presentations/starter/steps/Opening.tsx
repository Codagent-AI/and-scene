import type { SceneProps } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'

export interface Payload { label: string }
export function Opening({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id="starter:opening" className="starter-box">{payload.label}</Box></SceneLayer>
}
