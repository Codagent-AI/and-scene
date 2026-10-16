import { AnimatePresence } from 'motion/react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { AT, FIRST_STEP, ID } from '../entities'

export interface ScenePayload {
  /** 1-based step number whose accumulated diagram is shown. */
  n: number
}

/**
 * One persistent scene for the whole presentation: entities keep their ids across
 * steps, so persisting ones morph in place and newcomers fade in after they settle.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const on = (k: keyof typeof ID) => payload.n >= FIRST_STEP[k]
  const at = (k: keyof typeof ID) => ({ position: 'absolute', left: AT[k].x, top: AT[k].y }) as const
  const size = (k: keyof typeof ID) => ({ width: AT[k].w, height: AT[k].h })

  return (
    <SceneLayer>
      <AnimatePresence>
        {on('subject') && (
          <Appear key="subject" style={at('subject')}>
            <Box id={ID.subject} kind="node" style={size('subject')}>subject</Box>
          </Appear>
        )}
        {on('detail') && (
          <Appear key="detail" style={at('detail')}>
            <Box id={ID.detail} kind="node" style={size('detail')}>detail</Box>
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
