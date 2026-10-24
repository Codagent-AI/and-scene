import type { ReactNode } from 'react'
import { Appear, Arrow, Box, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { GEOMETRY } from './entities.ts'
import type { EntityId, ScenePayload } from './entities.ts'

const box = (id: EntityId) => ({ id, x: GEOMETRY[id].x, y: GEOMETRY[id].y, width: GEOMETRY[id].w, height: GEOMETRY[id].h })

const VIEWS: Record<EntityId, () => ReactNode> = {
  topic: () => <Box {...box('topic')}>topic</Box>,
  idea: () => <Box {...box('idea')}>idea</Box>,
  link: () => (
    <Arrow
      id="link"
      from={{ x: GEOMETRY.link.x, y: GEOMETRY.link.y }}
      to={{ x: GEOMETRY.link.x + GEOMETRY.link.w, y: GEOMETRY.link.y }}
    />
  ),
}

/**
 * One scene shared by every step (same groupKey): the instance persists and only
 * the visible set changes, so retained entities stay put and newcomers fade in.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const shown = new Set(payload.visible)
  return (
    <SceneLayer>
      {(Object.keys(VIEWS) as EntityId[])
        .filter((id) => shown.has(id))
        .map((id) => (
          <Appear key={id}>{VIEWS[id]()}</Appear>
        ))}
    </SceneLayer>
  )
}
