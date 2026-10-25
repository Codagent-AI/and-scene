import { AnimatePresence } from 'motion/react'
import { Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { entity } from './entities'
export function Scene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><AnimatePresence><Box key="idea" entityId={entity('idea')} style={{ position: 'absolute', left: 40, top: 70 }}>{payload.label}</Box></AnimatePresence></SceneLayer>
}
