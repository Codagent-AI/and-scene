import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, Label, SceneLayer } from '../../../presentation-kit/index.ts'
import type { SceneProps } from '../../../presentation-kit/index.ts'
import { ENT } from '../entities.ts'

export interface ScenePayload {
  /** Index of the active beat; entities accumulate up to it. */
  beat: number
}

/** One persistent scene; only `payload.beat` changes between steps. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const { beat } = payload
  return (
    <SceneLayer>
      <AnimatePresence>
        {beat >= 0 && (
          <Appear key="b0">
            <Box id={ENT.you} at={{ x: 60, y: 140, w: 160, h: 80 }}>
              <Label id={`${ENT.you}-label`}>start</Label>
            </Box>
          </Appear>
        )}
        {beat >= 1 && (
          <Appear key="b1">
            <Box id={ENT.topic} at={{ x: 360, y: 140, w: 160, h: 80 }}>
              <Label id={`${ENT.topic}-label`}>next</Label>
            </Box>
            <Arrow id={`${ENT.topic}-link`} from={{ x: 222, y: 180 }} to={{ x: 358, y: 180 }} />
          </Appear>
        )}
        {beat >= 2 && (
          <Appear key="b2">
            <Box id={ENT.next} at={{ x: 660, y: 140, w: 160, h: 80 }}>
              <Label id={`${ENT.next}-label`}>done</Label>
            </Box>
            <Arrow id={`${ENT.next}-link`} from={{ x: 522, y: 180 }} to={{ x: 658, y: 180 }} />
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
