import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { RECTS } from './entities.ts'

export interface SceneState {
  second: boolean
  moved: boolean
}

const place = (r: { x: number; y: number; w: number; h: number }) => ({
  position: 'absolute' as const, left: r.x, top: r.y, width: r.w, height: r.h,
})

/** One persistent scene: `first` keeps its id, so it morphs in place when it moves. */
export function ExampleScene({ payload }: SceneProps<SceneState>) {
  const first = payload.moved ? RECTS['first-moved'] : RECTS.first
  return (
    <SceneLayer>
      <Box id="first" style={place(first)}>first</Box>
      <AnimatePresence>
        {payload.second && (
          <Appear key="second">
            <Box id="second" style={place(RECTS.second)}>second</Box>
            <Arrow id="link" from={{ x: 240, y: 180 }} to={{ x: 600, y: 180 }} />
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
