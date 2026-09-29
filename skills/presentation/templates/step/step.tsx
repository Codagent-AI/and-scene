import { SceneLayer, Box } from '../../../presentation-kit/nodes/index.ts'
import { ENTITY } from '../entities.ts'

export function StepScene() {
  return <SceneLayer>
    {/* Reuse stable IDs for entities that continue from earlier states. */}
    <Box id={ENTITY.subject} className="subject">Scene content</Box>
  </SceneLayer>
}
