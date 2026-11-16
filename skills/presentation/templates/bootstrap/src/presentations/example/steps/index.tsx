import { AnimatePresence } from 'motion/react'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { Step, SceneProps } from '../../../presentation-kit/types'
import { entities } from '../entities'
function Scene({ payload }: SceneProps<{ expanded: boolean }>) {
  return <SceneLayer><Box entityId={entities.idea} style={{ position: 'absolute', left: 100, top: 80 }}>Your topic</Box><AnimatePresence>{payload.expanded && <Appear key="detail" style={{ position: 'absolute', left: 300, top: 80 }}>A new detail</Appear>}</AnimatePresence></SceneLayer>
}
export const steps: Step<{ expanded: boolean }>[] = [
  { id: 'idea', era: 'begin', title: 'Start with an idea', caption: 'Introduce your topic here.', Scene, groupKey: 'story', payload: { expanded: false } },
  { id: 'detail', era: 'develop', title: 'Let it develop', caption: 'Explain what changes while the idea persists.', Scene, groupKey: 'story', payload: { expanded: true } },
]
