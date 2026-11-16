import { AnimatePresence } from 'motion/react'
import { Box } from '../../presentation-kit/nodes/Box'
import { Appear } from '../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../presentation-kit/types'
import { entities } from './entities'
type Payload = { label: string; x: number; detail?: string }
function Diagram({ payload }: SceneProps<Payload>) {
  return <SceneLayer>
    <Box id={entities.idea} style={{ position: 'absolute', left: payload.x, top: 120 }}>{payload.label}</Box>
    <AnimatePresence>{payload.detail && <Appear key="detail"><p>{payload.detail}</p></Appear>}</AnimatePresence>
  </SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'start', era: 'the idea', title: 'Start with an idea', caption: 'A paragraph for self-guided readers.', Scene: Diagram, groupKey: 'idea', payload: { label: 'Idea', x: 180 } },
  { id: 'develop', era: 'the idea', title: 'Let it develop', caption: 'The same entity moves as the explanation develops.', Scene: Diagram, groupKey: 'idea', payload: { label: 'Developed idea', x: 440, detail: 'A new supporting detail.' } },
]
