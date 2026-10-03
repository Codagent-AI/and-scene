import { SceneLayer, Box } from '../../../presentation-kit/nodes/index.ts'
import { ENTITY } from '../entities.ts'

export function FirstStep() {
  return <SceneLayer><Box id={ENTITY.subject} className="subject">A concrete idea</Box></SceneLayer>
}
