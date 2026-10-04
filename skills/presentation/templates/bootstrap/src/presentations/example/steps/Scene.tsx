import type { SceneProps } from '../../../presentation-kit'
import { Box, Label, SceneLayer } from '../../../presentation-kit'
import { ENTITY } from '../entities'
type Payload = { label: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id={ENTITY.idea} className="example-card"><Label id={ENTITY.label}>{payload.label}</Label></Box></SceneLayer>
}
