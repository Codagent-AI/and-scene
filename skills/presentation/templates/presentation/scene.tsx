import type { ReactNode } from 'react'
import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { ENTITIES, entityId, type EntityId } from './entities.ts'

export interface ScenePayload {
  /** Index of the active step; entities created on a later step are absent. */
  index: number
}

const NODES: Record<EntityId, () => ReactNode> = {
  subject: () => (
    <Box id={entityId('subject')} x={340} y={60} w={200} h={80}>
      subject
    </Box>
  ),
  detail: () => (
    <Box id={entityId('detail')} x={340} y={220} w={200} h={80}>
      detail
    </Box>
  ),
}

/** One scene instance renders every step; newcomers wait for the others to settle. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const ids = Object.keys(ENTITIES) as EntityId[]
  return (
    <SceneLayer>
      {ids
        .filter((id) => ENTITIES[id] <= payload.index)
        .map((id) => (
          <Appear key={id}>{NODES[id]()}</Appear>
        ))}
    </SceneLayer>
  )
}
