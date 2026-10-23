import type { ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit/index.ts'
import { entitiesAt, type EntityId } from './entities.ts'

export interface StarterPayload {
  step: number
}

const RENDER: Record<EntityId, () => ReactNode> = {
  first: () => (
    <Box id="first" style={{ left: 120, top: 150, width: 160, height: 80 }}>
      first
    </Box>
  ),
  second: () => (
    <Box id="second" style={{ left: 600, top: 150, width: 160, height: 80 }}>
      second
    </Box>
  ),
  link: () => <Arrow id="link" from={[284, 190]} to={[596, 190]} />,
}

/** One evolving scene: each step reveals more of it and never moves what is already shown. */
export function StarterScene({ payload }: SceneProps<StarterPayload>) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {entitiesAt(payload.step).map((id) => (
          <Appear key={id}>{RENDER[id]()}</Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
