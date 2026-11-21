import { motion } from 'motion/react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'

export type DiagramState = { expanded: boolean }

export function Diagram({ payload }: SceneProps<DiagramState>) {
  return (
    <SceneLayer>
      <Box key={entities.anchor} id={entities.anchor}
        style={{ position: 'absolute', left: payload.expanded ? 165 : 85, top: 150 }}>
        Start here
      </Box>
      {payload.expanded && <Appear key={entities.extension}>
        <motion.div layout layoutId={entities.extension} style={{ position: 'absolute', left: 420, top: 150 }}>
          Build on it
        </motion.div>
      </Appear>}
    </SceneLayer>
  )
}
