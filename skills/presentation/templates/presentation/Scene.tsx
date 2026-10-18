import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'
import type { ScenePayload } from './types'

/**
 * One scene for every step. Entities already on screen render bare so they morph in
 * place; entities introduced later sit inside `Appear` and fade in after the morph.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const { step } = payload
  const E = ENTITIES
  return (
    <SceneLayer>
      {step >= E.subject.since && (
        <Box key="subject" id={E.subject.id} at={E.subject.at}>
          subject
        </Box>
      )}
      {step >= E.detail.since && (
        <Appear key="appear:detail">
          <Box id={E.detail.id} at={E.detail.at}>
            detail
          </Box>
        </Appear>
      )}
      {step >= E.summary.since && (
        <Appear key="appear:summary">
          <Box id={E.summary.id} at={E.summary.at}>
            summary
          </Box>
        </Appear>
      )}
    </SceneLayer>
  )
}
