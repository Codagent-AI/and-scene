import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps } from '../../../presentation-kit/types'
import { entities } from '../entities'

export interface DiagramState { x: number; label: string }

export function Scene({ payload }: SceneProps<DiagramState>) {
  return <SceneLayer>
    <Box layoutId={entities.idea} style={{ position: 'absolute', left: payload.x, top: 160 }}>
      {payload.label}
    </Box>
  </SceneLayer>
}
