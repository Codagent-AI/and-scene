import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'
export function Scene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><Box id={entities.idea} className="idea" style={{ position: 'absolute', left: 180, top: 120, width: 240, height: 100 }}>{payload.label}</Box></SceneLayer>
}
