import { Appear, Box, SceneLayer } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { ENTITIES } from './entities.ts'
import type { EntityId } from './entities.ts'

export interface Payload {
  /** Every entity on the canvas in this step. Keep entities from earlier steps so they morph, not redraw. */
  visible: readonly EntityId[]
}

/** The one evolving scene: steps only change which entities are visible (and where they sit). */
export function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      {payload.visible.map((id) => {
        const { x, y, w, h, label } = ENTITIES[id]
        return (
          <Appear key={id}>
            <Box id={id} x={x} y={y} w={w} h={h} label={label} />
          </Appear>
        )
      })}
    </SceneLayer>
  )
}
