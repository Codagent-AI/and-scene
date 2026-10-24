import { Fragment } from 'react'
import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'

export interface ScenePayload {
  /** 1-based step this payload shows. */
  step: number
}

/** One persistent scene: later steps add entities, and existing ones keep their identity. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((entity) => entity.introducedAt <= payload.step).map((entity) => {
        const box = (
          <Box id={entity.id} at={entity.at}>
            {entity.label}
          </Box>
        )
        // Entities present from the first step need no entrance; later ones enter as newcomers.
        return entity.introducedAt === 1 ? <Fragment key={entity.id}>{box}</Fragment> : <Appear key={entity.id}>{box}</Appear>
      })}
    </SceneLayer>
  )
}
