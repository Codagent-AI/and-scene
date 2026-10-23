import { Arrow, Box, SceneLayer, usePrevious } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { EDGES, ENTITIES } from '../entities'

export interface ScenePayload {
  /** 1-based step number whose entities are visible. */
  n: number
}

/**
 * One evolving scene. Entities keep their stable ids (layoutId) across steps, so they morph
 * in place. Only entities introduced by the current transition carry `appear`; continuing
 * entities are never wrapped or faded again, and leavers exit with the layer.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const previous = usePrevious(payload.n, 0)
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => payload.n >= e.since).map((e) => (
        <Box
          key={e.id}
          id={e.id}
          x={e.x}
          y={e.y}
          width={e.width}
          height={e.height}
          appear={e.since > previous}
          className="entity"
        >
          {e.id}
        </Box>
      ))}
      {EDGES.filter((e) => payload.n >= e.since).map((e) => (
        <Arrow key={e.id} id={e.id} from={e.from} to={e.to} appear={e.since > previous} className="edge" />
      ))}
    </SceneLayer>
  )
}
