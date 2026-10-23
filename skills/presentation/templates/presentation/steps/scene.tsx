import { Appear, Arrow, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { EDGES, ENTITIES } from '../entities'

export interface ScenePayload {
  /** 1-based step number whose entities are visible. */
  n: number
}

/**
 * One evolving scene. Entities keep their stable ids (layoutId) across steps, so they
 * morph in place; only newcomers sit inside <Appear>, and leavers exit with the layer.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => payload.n >= e.since).map((e) => (
        <Appear key={e.id}>
          <Box id={e.id} x={e.x} y={e.y} width={e.width} height={e.height} className="entity">
            {e.id}
          </Box>
        </Appear>
      ))}
      {EDGES.filter((e) => payload.n >= e.since).map((e) => (
        <Appear key={e.id}>
          <Arrow id={e.id} from={e.from} to={e.to} className="edge" />
        </Appear>
      ))}
    </SceneLayer>
  )
}
