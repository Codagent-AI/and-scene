import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITY_IDS as E } from '../entities'

/** Which beat (1-2) of the starter scene is showing. */
export interface SceneState {
  beat: number
}

const at = (left: number, top: number, width: number, height: number) => ({ left, top, width, height })
const overlay = { position: 'absolute', inset: 0, pointerEvents: 'none' } as const

export function Scene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer>
      <Box id={E.hello} style={{ position: 'absolute', ...at(160, 150, 200, 80) }}>
        Hello
      </Box>
      <AnimatePresence>
        {payload.beat >= 2 && (
          <Appear key="world" style={overlay}>
            <Box id={E.world} style={{ position: 'absolute', ...at(520, 150, 200, 80) }}>
              World
            </Box>
            <Arrow id={E.link} from={[364, 190]} to={[516, 190]} />
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
