import { AnimatePresence } from 'motion/react'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { entities } from '../entities'
interface Payload { label: string; x: number; detail?: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box entityId={entities.topic} style={{ position: 'absolute', left: payload.x, top: 100 }}>{payload.label}</Box><AnimatePresence>{payload.detail && <Appear key="detail"><span>{payload.detail}</span></Appear>}</AnimatePresence></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'idea', era: 'the idea', title: 'Start with an idea', caption: 'Describe the opening beat.', groupKey: 'idea', Scene, payload: { label: 'Idea', x: 100 } },
  { id: 'develop', era: 'the story', title: 'Develop the story', caption: 'Explain what changes and why.', groupKey: 'idea', Scene, payload: { label: 'An evolving idea', x: 300, detail: 'A new detail' } },
]
