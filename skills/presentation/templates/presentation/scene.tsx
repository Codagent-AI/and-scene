import { Fragment } from 'react'
import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ENTITIES, type DiagramState } from './entities'

/**
 * The scene every step renders. An entity visible in the previous step is continuing and mounts
 * unwrapped; a newcomer wraps in Appear so it enters after the persisting entities have moved.
 */
export function Diagram({ payload, previous }: SceneProps<DiagramState>) {
  const before = new Set(previous?.visible ?? [])
  return (
    <SceneLayer>
      {payload.visible.map((id) => {
        const { text, geometry } = ENTITIES[id]
        const node = (
          <Box id={id} geometry={geometry} emphasized={payload.emphasized.includes(id)}>
            {text}
          </Box>
        )
        return before.has(id) ? <Fragment key={id}>{node}</Fragment> : <Appear key={id}>{node}</Appear>
      })}
    </SceneLayer>
  )
}
