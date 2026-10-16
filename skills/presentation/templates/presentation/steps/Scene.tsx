import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../../presentation-kit'
import { ID } from '../entities'

export interface Payload {
  /** 1-based number of the beat being shown. */
  n: number
}

/** One evolving scene: `payload.n` decides which entities are on screen. Canvas is 880 x 380. */
export function Scene({ payload }: SceneProps<Payload>) {
  const { n } = payload
  return (
    <SceneLayer>
      <Box id={ID.subject} className="subject" x={80} y={140} w={200} h={80}>
        subject
      </Box>
      <AnimatePresence>
        {n >= 2 && (
          <Appear key="detail">
            <Box id={ID.detail} className="detail" x={600} y={140} w={200} h={80}>
              detail
            </Box>
            <Arrow id={ID.link} className="link" from={[290, 180]} to={[590, 180]} />
          </Appear>
        )}
      </AnimatePresence>
    </SceneLayer>
  )
}
