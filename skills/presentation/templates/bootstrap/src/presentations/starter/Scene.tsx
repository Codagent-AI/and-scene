import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { entitiesAt } from './entities.ts'

export interface SceneState {
  /** Number of the step being shown. */
  stage: number
}

/** One scene for every step: steps only change `payload.stage`, so entities persist and morph. */
export function Scene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      {entitiesAt(payload.stage).map((entity) => (
        <Appear key={entity.id}>
          <Box id={entity.id} x={entity.x} y={entity.y} w={entity.w} h={entity.h} label={entity.text} />
        </Appear>
      ))}
    </SceneLayer>
  )
}
