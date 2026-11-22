import { AnimatePresence } from 'motion/react'
import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entrance } from '../../../presentation-kit/nodes/Node'
import { entities } from '../entities'
interface Payload { label: string }
function Diagram({ payload }: SceneProps<Payload>) {
  return <SceneLayer><AnimatePresence><Box key={entities.idea} id={entities.idea} {...entrance} style={{ position: 'absolute', left: 240, top: 120, width: 400, height: 120 }}>{payload.label}</Box></AnimatePresence></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
  { id: 'opening', era: 'the idea', title: 'Your title', caption: 'Your opening caption.', Scene: Diagram, groupKey: 'idea', payload: { label: 'Your idea' } },
  { id: 'next', era: 'the idea', title: 'The next beat', caption: 'Your next caption.', Scene: Diagram, groupKey: 'idea', payload: { label: 'The idea evolves' } },
]
