import { AnimatePresence } from 'motion/react'
import { Box, SceneLayer } from '../../presentation-kit'
import type { Step, SceneProps } from '../../presentation-kit'
import { entity } from './entities'
function Scene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><AnimatePresence><Box key="idea" entityId={entity('idea')} style={{ position: 'absolute', left: 40, top: 70 }}>{payload.label}</Box></AnimatePresence></SceneLayer>
}
export const STEPS: Step<{ label: string }>[] = [
  { id: 'start', era: 'the idea', title: 'Your opening', caption: 'Explain the opening idea in a paragraph.', groupKey: 'idea', Scene, payload: { label: 'An idea' } },
  { id: 'develop', era: 'the idea', title: 'Develop it', caption: 'Explain how the idea changes while preserving its identity.', groupKey: 'idea', Scene, payload: { label: 'The idea, developed' } },
]
