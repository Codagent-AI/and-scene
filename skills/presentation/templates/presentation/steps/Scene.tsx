import { Box } from '../../../presentation-kit/nodes/Box'
import type { SceneProps } from '../../../presentation-kit/types'
import { entities } from '../entities'
export interface Payload { label: string }
export function Scene({ payload }: SceneProps<Payload>) {
  return <Box id={entities.subject} style={{ position: 'absolute', left: 80, top: 80 }}>{payload.label}</Box>
}
