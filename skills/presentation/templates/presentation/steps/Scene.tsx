import { AnimatePresence } from 'motion/react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITY_IDS as E } from '../entities'
import '../talk.css'

/** Which beat of the story the one shared scene is showing. */
export interface SceneState {
  beat: number
}

const at = (left: number, top: number, width: number, height: number) => ({ left, top, width, height })
const overlay = { position: 'absolute', inset: 0, pointerEvents: 'none' } as const

/** Entities accumulate: earlier beats stay mounted; newcomers enter through <Appear>. */
export function Scene({ payload }: SceneProps<SceneState>) {
  return (
    <SceneLayer className="scene">
      <Box id={E.subject} className="subject" style={at(100, 100, 200, 80)}>
        {{entity-label}}
      </Box>
      <AnimatePresence>
        {payload.beat >= 2 && (
          <Appear key="newcomer" style={overlay}>
            {/* newcomers for beat 2+ go here */}
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
