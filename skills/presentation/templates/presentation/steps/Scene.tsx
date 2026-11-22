import { AnimatePresence } from 'motion/react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity } from '../entities'
export function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>
    <Box entity={entity('idea')} style={{ position: 'absolute', left: 100, top: 140 }}>Your idea</Box>
    {payload >= 2 && <Appear key="connection"><Box entity={entity('connection')} style={{ position: 'absolute', left: 450, top: 140 }}>The next connection</Box></Appear>}
  </AnimatePresence></SceneLayer>
}
