import { AnimatePresence } from 'motion/react'
import { Appear, Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entity } from '../entities'
function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>
    <Box entity={entity('idea')} style={{ position: 'absolute', left: 100, top: 140 }}>Your idea</Box>
    {payload >= 2 && <Appear key="connection"><Box entity={entity('connection')} style={{ position: 'absolute', left: 450, top: 140 }}>The next connection</Box></Appear>}
  </AnimatePresence></SceneLayer>
}
export const STEPS: Step<number>[] = [
  { id: 'opening', era: 'the idea', title: '__TITLE__', caption: 'Introduce the idea and its context.', groupKey: 'idea', Scene, payload: 1 },
  { id: 'connection', era: 'the idea', title: 'Make the connection', caption: 'Build on the same diagram with a new connection.', groupKey: 'idea', Scene, payload: 2 },
]
